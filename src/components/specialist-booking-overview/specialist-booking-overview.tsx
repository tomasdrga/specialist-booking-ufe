import { Component, Host, h } from '@stencil/core';
import '@material/web/list/list';
import '@material/web/list/list-item';
import '@material/web/icon/icon';

interface AppointmentPreview {
  patientName: string;
  patientId: string;
  startsAt: Date;
  durationMinutes: number;
  examinationType: string;
  status: string;
}

interface TimeSlotPreview {
  startsAt: Date;
  durationMinutes: number;
  capacity: number;
  booked: number;
  examinationType: string;
  urgentBlocked: boolean;
}

@Component({
  tag: 'specialist-booking-overview',
  styleUrl: 'specialist-booking-overview.css',
  shadow: true,
})
export class SpecialistBookingOverview {
  appointments: AppointmentPreview[];
  timeSlots: TimeSlotPreview[];

  async componentWillLoad() {
    [this.appointments, this.timeSlots] = await Promise.all([
      this.getAppointmentsAsync(),
      this.getTimeSlotsAsync(),
    ]);
  }

  private async getAppointmentsAsync(): Promise<AppointmentPreview[]> {
    return await Promise.resolve([
      {
        patientName: 'Jana Nováková',
        patientId: '10001',
        startsAt: new Date(Date.now() + 65 * 60 * 1000),
        durationMinutes: 30,
        examinationType: 'Kardiologické vyšetrenie',
        status: 'Potvrdené',
      },
      {
        patientName: 'Peter Horváth',
        patientId: '10096',
        startsAt: new Date(Date.now() + 130 * 60 * 1000),
        durationMinutes: 45,
        examinationType: 'Neurologická konzultácia',
        status: 'Čaká na potvrdenie',
      },
      {
        patientName: 'Mária Kováčová',
        patientId: '10028',
        startsAt: new Date(Date.now() + 190 * 60 * 1000),
        durationMinutes: 20,
        examinationType: 'Dermatologická kontrola',
        status: 'Nová žiadosť',
      },
    ]);
  }

  private async getTimeSlotsAsync(): Promise<TimeSlotPreview[]> {
    return await Promise.resolve([
      {
        startsAt: new Date(Date.now() + 60 * 60 * 1000),
        durationMinutes: 30,
        capacity: 2,
        booked: 1,
        examinationType: 'Kardiológia',
        urgentBlocked: false,
      },
      {
        startsAt: new Date(Date.now() + 120 * 60 * 1000),
        durationMinutes: 45,
        capacity: 1,
        booked: 1,
        examinationType: 'Neurológia',
        urgentBlocked: false,
      },
      {
        startsAt: new Date(Date.now() + 180 * 60 * 1000),
        durationMinutes: 30,
        capacity: 1,
        booked: 0,
        examinationType: 'Dermatológia',
        urgentBlocked: true,
      },
    ]);
  }

  render() {
    return (
      <Host>
        <section class="hero">
          <p class="eyebrow">Systém objednávania ku špecialistovi</p>
          <h1>Prehľad dnešných objednávok a kapacity ambulancie</h1>
          <p class="lead">
            Pacienti a odosielajúci lekári získajú jasný rezervačný tok, ambulancia vidí obsadenosť termínov.
          </p>
        </section>

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
                <md-list-item>
                  <div slot="headline">{appointment.patientName}</div>
                  <div slot="supporting-text">
                    {appointment.examinationType + ' · ' + appointment.startsAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + appointment.durationMinutes + ' min'}
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
                  <strong>{slot.startsAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                  <span>{slot.examinationType}</span>
                  <small>{slot.urgentBlocked ? 'Blokované pre urgentný prípad' : slot.booked + '/' + slot.capacity + ' obsadené · ' + slot.durationMinutes + ' min'}</small>
                </article>
              ))}
            </div>
          </section>
        </div>
      </Host>
    );
  }
}
