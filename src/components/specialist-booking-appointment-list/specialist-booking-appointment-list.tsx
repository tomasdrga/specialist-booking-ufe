import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { Appointment, Configuration, SpecialistBookingApi, TimeSlot } from '../../api/specialist-booking';

@Component({
  tag: 'specialist-booking-appointment-list',
  styleUrl: 'specialist-booking-appointment-list.css',
  shadow: true,
})
export class SpecialistBookingAppointmentList {
  @Event({ eventName: 'entry-clicked' }) entryClicked: EventEmitter<string>;
  @Event({ eventName: 'slots-opened' }) slotsOpened: EventEmitter<string>;

  @Prop() apiBase: string;
  @Prop() clinicId: string;
  @State() errorMessage: string;

  appointments: Appointment[] = [];
  timeSlots: TimeSlot[] = [];

  async componentWillLoad() {
    [this.appointments, this.timeSlots] = await Promise.all([this.getAppointmentsAsync(), this.getTimeSlotsAsync()]);
  }

  private api() {
    return new SpecialistBookingApi(new Configuration({ basePath: this.apiBase }));
  }

  private async getAppointmentsAsync(): Promise<Appointment[]> {
    try {
      const response = await this.api().getAppointmentsRaw({ clinicId: this.clinicId });
      if (response.raw.status < 299) {
        return await response.value();
      }
      this.errorMessage = `Cannot retrieve appointments: ${response.raw.statusText}`;
    } catch (err: any) {
      this.errorMessage = `Cannot retrieve appointments: ${err.message || 'unknown'}`;
    }
    return [];
  }

  private async getTimeSlotsAsync(): Promise<TimeSlot[]> {
    try {
      const response = await this.api().getTimeSlotsRaw({ clinicId: this.clinicId });
      if (response.raw.status < 299) {
        return await response.value();
      }
      this.errorMessage = `Cannot retrieve time slots: ${response.raw.statusText}`;
    } catch (err: any) {
      this.errorMessage = `Cannot retrieve time slots: ${err.message || 'unknown'}`;
    }
    return [];
  }

  render() {
    return (
      <Host>
        <section class="hero">
          <div>
            <p class="eyebrow">Systém objednávania ku špecialistovi</p>
            <h1>Prehľad dnešných objednávok a kapacity ambulancie</h1>
          </div>
          <div class="hero-actions">
            <md-outlined-button onClick={() => this.slotsOpened.emit('slots')}>Kalendár termínov</md-outlined-button>
            <md-filled-button onClick={() => this.entryClicked.emit('@new')}>
              <md-icon slot="icon">add</md-icon>
              Nová objednávka
            </md-filled-button>
          </div>
        </section>

        {this.errorMessage ? (
          <div class="error">{this.errorMessage}</div>
        ) : (
          <div class="layout">
            <section class="panel appointments">
              <div class="panel-heading">
                <span class="icon-badge"><md-icon>event_available</md-icon></span>
                <div>
                  <p class="label">Appointment CRUD</p>
                  <h2>Najbližšie objednávky</h2>
                </div>
              </div>

              <md-list>
                {this.appointments.map(appointment => (
                  <md-list-item onClick={() => this.entryClicked.emit(appointment.id)}>
                    <div slot="headline">{appointment.patientName}</div>
                    <div slot="supporting-text">
                      {appointment.examinationType + ' · ' + appointment.startsAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + appointment.durationMinutes + ' min'}
                    </div>
                    <md-icon slot="start">person</md-icon>
                    <span slot="end" class="status">{appointment.status}</span>
                  </md-list-item>
                ))}
              </md-list>
            </section>

            <section class="panel slots">
              <div class="panel-heading">
                <span class="icon-badge"><md-icon>calendar_month</md-icon></span>
                <div>
                  <p class="label">Time Slot CRUD</p>
                  <h2>Kapacita termínov</h2>
                </div>
              </div>

              <div class="slot-grid">
                {this.timeSlots.map(slot => (
                  <article class={{ slot: true, blocked: slot.urgentBlocked }}>
                    <strong>{slot.startsAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                    <span>{slot.examinationType}</span>
                    <small>{slot.urgentBlocked ? 'Blokované pre urgentný prípad' : slot.booked + '/' + slot.capacity + ' obsadené · ' + slot.durationMinutes + ' min'}</small>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
      </Host>
    );
  }
}
