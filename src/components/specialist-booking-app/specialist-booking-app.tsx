import { Component, Host, Prop, State, h } from '@stencil/core';

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

  @Prop() basePath: string = '';
  @Prop() apiBase: string;
  @Prop() clinicId: string;

  componentWillLoad() {
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

  render() {
    let element = 'list';
    let appointmentId = '@new';

    let slotId = '@new';

    if (this.relativePath.startsWith('appointment/')) {
      element = 'editor';
      appointmentId = this.relativePath.split('/')[1];
    } else if (this.relativePath.startsWith('slots')) {
      element = 'slots';
    } else if (this.relativePath.startsWith('slot/')) {
      element = 'slot-editor';
      slotId = this.relativePath.split('/')[1];
    }

    const navigate = (path: string) => {
      const absolute = new URL(path, new URL(this.basePath, document.baseURI)).pathname;
      window.navigation.navigate(absolute);
    };

    return (
      <Host>
        {element === 'editor' ? (
          <specialist-booking-appointment-editor
            appointment-id={appointmentId}
            clinic-id={this.clinicId}
            api-base={this.apiBase}
            oneditor-closed={() => navigate('./list')}
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
        ) : (
          <specialist-booking-appointment-list
            clinic-id={this.clinicId}
            api-base={this.apiBase}
            onslots-opened={() => navigate('./slots')}
            onentry-clicked={(ev: CustomEvent<string>) => navigate('./appointment/' + ev.detail)}
          ></specialist-booking-appointment-list>
        )}
      </Host>
    );
  }
}
