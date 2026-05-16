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
  @Event({ eventName: 'slot-booking-requested' }) slotBookingRequested: EventEmitter<TimeSlot>;
  @Event({ eventName: 'waitlist-opened' }) waitlistOpened: EventEmitter<string>;

  @Prop() apiBase: string;
  @Prop() clinicId: string;
  @Prop() role: 'patient' | 'doctor' = 'patient';
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
      if (response.raw.status < 299) return await response.value();
      this.errorMessage = `Nepodarilo sa načítať objednávky: ${response.raw.statusText}`;
    } catch (err: any) {
      this.errorMessage = `Nepodarilo sa načítať objednávky: ${err.message || 'neznáma chyba'}`;
    }
    return [];
  }

  private async getTimeSlotsAsync(): Promise<TimeSlot[]> {
    try {
      const response = await this.api().getTimeSlotsRaw({ clinicId: this.clinicId });
      if (response.raw.status < 299) return await response.value();
      this.errorMessage = `Nepodarilo sa načítať termíny: ${response.raw.statusText}`;
    } catch (err: any) {
      this.errorMessage = `Nepodarilo sa načítať termíny: ${err.message || 'neznáma chyba'}`;
    }
    return [];
  }

  private renderPatient() {
    const availableSlots = this.timeSlots.filter(s => !s.urgentBlocked && s.booked < s.capacity);
    const statusLabels: Record<string, string> = {
      requested: 'Čaká na potvrdenie',
      confirmed: 'Potvrdené',
      completed: 'Ukončené',
      cancelled: 'Zrušené',
    };

    return (
      <Host>
        <section class="hero">
          <div>
            <p class="eyebrow">Objednávanie ku špecialistovi</p>
            <h1>Objednajte sa k špecialistovi online</h1>
          </div>
          <div class="hero-actions">
            <button class="hero-cta" onClick={() => this.entryClicked.emit('@new')}>
              <md-icon>add</md-icon>
              Objednať sa
            </button>
          </div>
        </section>

        <div class="flow-note">
          <strong>Ako to funguje:</strong> vyberte si voľný termín alebo odošlite žiadosť. Ak je vhodný termín voľný, systém ho potvrdí automaticky. Ak nie, žiadosť prevezme ambulancia v čakacej listine.
        </div>

        {this.errorMessage ? (
          <div class="error">{this.errorMessage}</div>
        ) : (
          <div class="layout">
            <section class="panel">
              <div class="panel-heading">
                <span class="icon-badge"><md-icon>calendar_today</md-icon></span>
                <div>
                  <p class="label">Dostupné termíny</p>
                  <h2>Voľné termíny</h2>
                </div>
              </div>
              <div class="slot-grid">
                {availableSlots.length === 0
                  ? <p class="empty-msg">Momentálne nie sú dostupné žiadne voľné termíny. Kliknite na „Objednať sa“ a ambulancia vás zaradí do čakacej listiny.</p>
                  : availableSlots.map(slot => (
                      <button class="slot slot-bookable" onClick={() => this.slotBookingRequested.emit(slot)}>
                        <strong>{slot.startsAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                        <span>{slot.examinationType}</span>
                        <small>{slot.durationMinutes} min</small>
                        <span class="slot-book-hint"><md-icon>arrow_forward</md-icon>Objednať</span>
                      </button>
                    ))
                }
              </div>
            </section>

            <section class="panel">
              <div class="panel-heading">
                <span class="icon-badge"><md-icon>event_available</md-icon></span>
                <div>
                  <p class="label">Moje objednávky</p>
                  <h2>História objednávok</h2>
                </div>
              </div>
              <div class="appointment-list">
                {this.appointments.length === 0
                  ? <p class="empty-msg">Nemáte žiadne objednávky.</p>
                  : this.appointments.map(a => (
                      <div class="appointment-row" onClick={() => this.entryClicked.emit(a.id)}>
                        <md-icon class="row-icon">event</md-icon>
                        <div class="row-text">
                          <span class="row-name">{a.examinationType}</span>
                          <span class="row-detail">{a.startsAt?.toLocaleString('sk-SK', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) + ' · ' + a.durationMinutes + ' min'}</span>
                        </div>
                        <span class={`status ${a.status}`}>{statusLabels[a.status] ?? a.status}</span>
                      </div>
                    ))
                }
              </div>
            </section>
          </div>
        )}
      </Host>
    );
  }

  private renderDoctor() {
    const confirmed = this.appointments.filter(a => a.status === 'confirmed').length;
    const pending = this.appointments.filter(a => a.status === 'requested').length;
    const available = this.timeSlots.filter(s => !s.urgentBlocked && s.booked < s.capacity).length;

    return (
      <Host>
        <section class="hero">
          <div>
            <p class="eyebrow">Systém objednávania ku špecialistovi</p>
            <h1>Prehľad dnešných objednávok a kapacity ambulancie</h1>
          </div>
          <div class="hero-actions">
            <button class="hero-secondary" onClick={() => this.waitlistOpened.emit('waitlist')}>
              <md-icon>hourglass_top</md-icon>
              Čakacia listina
            </button>
          </div>
        </section>

        <div class="flow-note">
          <strong>Práca ambulancie:</strong> lekár spravuje kapacity termínov, kontroluje čakajúce žiadosti a mení stavy objednávok. Nové žiadosti sa do termínov priraďujú automaticky podľa typu vyšetrenia a kapacity.
        </div>

        <div class="stats-row">
          <div class="stat-card">
            <span class="stat-value">{this.appointments.length}</span>
            <span class="stat-label">Celkom</span>
          </div>
          <div class="stat-card stat-confirmed">
            <span class="stat-value">{confirmed}</span>
            <span class="stat-label">Potvrdené</span>
          </div>
          <div class="stat-card stat-pending">
            <span class="stat-value">{pending}</span>
            <span class="stat-label">Čakajú</span>
          </div>
          <div class="stat-card stat-slots">
            <span class="stat-value">{available}</span>
            <span class="stat-label">Voľné termíny</span>
          </div>
        </div>

        {this.errorMessage ? (
          <div class="error">{this.errorMessage}</div>
        ) : (
          <div class="layout">
            <section class="panel">
              <div class="panel-heading">
                <span class="icon-badge"><md-icon>event_available</md-icon></span>
                <div>
                  <p class="label">Správa objednávok</p>
                  <h2>Najbližšie objednávky</h2>
                </div>
              </div>
              <div class="appointment-list">
                {this.appointments.map(a => (
                  <div class="appointment-row" onClick={() => this.entryClicked.emit(a.id)}>
                    <md-icon class="row-icon">person</md-icon>
                    <div class="row-text">
                      <span class="row-name">{a.patientName}</span>
                      <span class="row-detail">{a.examinationType + ' · ' + a.startsAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + a.durationMinutes + ' min'}</span>
                    </div>
                    <span class={`status ${a.status}`}>{
                      {
                        requested: 'Čaká na potvrdenie',
                        confirmed: 'Potvrdené',
                        completed: 'Ukončené',
                        cancelled: 'Zrušené',
                      }[a.status] ?? a.status
                    }</span>
                  </div>
                ))}
              </div>
            </section>

            <section class="panel">
              <div class="panel-heading">
                <span class="icon-badge"><md-icon>calendar_month</md-icon></span>
                <div>
                  <p class="label">Správa termínov</p>
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
              <div class="panel-footer">
                <button class="footer-link" onClick={() => this.slotsOpened.emit('slots')}>
                  Spravovať termíny
                  <md-icon>arrow_forward</md-icon>
                </button>
              </div>
            </section>
          </div>
        )}
      </Host>
    );
  }

  render() {
    return this.role === 'patient' ? this.renderPatient() : this.renderDoctor();
  }
}
