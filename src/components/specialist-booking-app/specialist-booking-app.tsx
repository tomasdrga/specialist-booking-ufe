import { Component, Host, Prop, State, h } from '@stencil/core';
import { TimeSlot } from '../../api/specialist-booking';

declare global {
  interface Window {
    navigation: any;
  }
}

@Component({
  tag: 'specialist-booking-app',
  styleUrl: 'specialist-booking-app.css',
  shadow: true,
})
export class SpecialistBookingApp {
  @State() private relativePath = '';
  @State() private role: 'patient' | 'doctor' = (sessionStorage.getItem('sb-role') as 'patient' | 'doctor') ?? 'patient';
  @State() private pendingSlot: TimeSlot | null = null;

  @Prop() basePath: string = '';
  @Prop() apiBase: string;
  @Prop() clinicId: string;

  private static slotFromStorage(): TimeSlot | null {
    const raw = sessionStorage.getItem('sb-pending-slot');
    if (!raw) return null;
    const obj = JSON.parse(raw);
    obj.startsAt = new Date(obj.startsAt);
    return obj as TimeSlot;
  }

  componentWillLoad() {
    this.pendingSlot = SpecialistBookingApp.slotFromStorage();
    const baseUri = new URL(this.basePath, document.baseURI || '/').pathname;

    const toRelative = (path: string) => {
      if (path.startsWith(baseUri)) {
        this.relativePath = path.slice(baseUri.length);
      } else {
        this.relativePath = '';
      }
    };

    window.navigation?.addEventListener('navigate', (ev: Event) => {
      if ((ev as any).canIntercept) {
        (ev as any).intercept();
      }
      const path = new URL((ev as any).destination.url).pathname;
      toRelative(path);
    });

    toRelative(location.pathname);
  }

  private setRole(role: 'patient' | 'doctor') {
    this.role = role;
    sessionStorage.setItem('sb-role', role);
    const absolute = new URL('./list', new URL(this.basePath, document.baseURI)).pathname;
    window.navigation.navigate(absolute);
  }

  render() {
    let element = 'list';
    let appointmentId = '@new';
    let slotId = '@new';

    if (this.relativePath.startsWith('appointment/')) {
      element = 'editor';
      appointmentId = this.relativePath.split('/')[1];
    } else if (this.relativePath.startsWith('slots') && this.role === 'doctor') {
      element = 'slots';
    } else if (this.relativePath.startsWith('slot/') && this.role === 'doctor') {
      element = 'slot-editor';
      slotId = this.relativePath.split('/')[1];
    } else if (this.relativePath.startsWith('waitlist')) {
      element = 'waitlist';
    }

    const navigate = (path: string) => {
      const absolute = new URL(path, new URL(this.basePath, document.baseURI)).pathname;
      window.navigation.navigate(absolute);
    };

    return (
      <Host>
        <div class="role-toggle">
          <button
            class={{ 'role-btn': true, 'active': this.role === 'patient' }}
            onClick={() => this.setRole('patient')}
          >
            <md-icon>person</md-icon>
            Pacient
          </button>
          <button
            class={{ 'role-btn': true, 'active': this.role === 'doctor' }}
            onClick={() => this.setRole('doctor')}
          >
            <md-icon>medical_services</md-icon>
            Lekár
          </button>
        </div>

        {element === 'editor' ? (
          <specialist-booking-appointment-editor
            appointment-id={appointmentId}
            clinic-id={this.clinicId}
            api-base={this.apiBase}
            prefill-slot={this.pendingSlot}
            role={this.role}
            oneditor-closed={() => { this.pendingSlot = null; sessionStorage.removeItem('sb-pending-slot'); navigate('./list'); }}
          ></specialist-booking-appointment-editor>
        ) : element === 'slot-editor' ? (
          <specialist-booking-slot-editor
            slot-id={slotId}
            clinic-id={this.clinicId}
            api-base={this.apiBase}
            oneditor-closed={() => navigate('./slots')}
          ></specialist-booking-slot-editor>
        ) : element === 'slots' ? (
          <specialist-booking-slot-calendar
            clinic-id={this.clinicId}
            api-base={this.apiBase}
            onappointments-opened={() => navigate('./list')}
            onslot-create-clicked={() => navigate('./slot/@new')}
            onslot-clicked={(ev: CustomEvent<string>) => navigate('./slot/' + ev.detail)}
          ></specialist-booking-slot-calendar>
        ) : element === 'waitlist' ? (
          <specialist-booking-waitlist-panel
            clinic-id={this.clinicId}
            api-base={this.apiBase}
            onappointments-opened={() => navigate('./list')}
          ></specialist-booking-waitlist-panel>
        ) : (
          <specialist-booking-appointment-list
            clinic-id={this.clinicId}
            api-base={this.apiBase}
            role={this.role}
            onslots-opened={() => navigate('./slots')}
            onwaitlist-opened={() => navigate('./waitlist')}
            onentry-clicked={(ev: CustomEvent<string>) => navigate('./appointment/' + ev.detail)}
            onslot-booking-requested={(ev: CustomEvent<TimeSlot>) => { this.pendingSlot = ev.detail; sessionStorage.setItem('sb-pending-slot', JSON.stringify(ev.detail)); navigate('./appointment/@new'); }}
          ></specialist-booking-appointment-list>
        )}
      </Host>
    );
  }
}
