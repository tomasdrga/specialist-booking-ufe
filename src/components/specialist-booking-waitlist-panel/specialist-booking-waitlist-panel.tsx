import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';

type WaitingListEntry = {
  appointmentId: string;
  patientName: string;
  examinationType: string;
  requestedAt: string;
};

type AssignResult = {
  message: string;
  assigned: boolean;
  waitingList: boolean;
  slotId?: string;
};

@Component({
  tag: 'specialist-booking-waitlist-panel',
  styleUrl: 'specialist-booking-waitlist-panel.css',
  shadow: true,
})
export class SpecialistBookingWaitlistPanel {
  @Prop() apiBase: string;
  @Prop() clinicId: string;

  @Event({ eventName: 'appointments-opened' }) appointmentsOpened: EventEmitter<string>;

  @State() entries: WaitingListEntry[] = [];
  @State() errorMessage: string;
  @State() infoMessage: string;
  @State() loading = false;

  async componentWillLoad() {
    await this.reload();
  }

  private async reload() {
    this.loading = true;
    this.errorMessage = undefined;
    try {
      const response = await fetch(`${this.apiBase}/specialist-booking/${this.clinicId}/waiting-list`);
      if (!response.ok) {
        this.errorMessage = `Nepodarilo sa načítať čakaciu listinu (${response.status})`;
        this.entries = [];
        return;
      }
      this.entries = (await response.json()) as WaitingListEntry[];
    } catch (e: any) {
      this.errorMessage = `Nepodarilo sa načítať čakaciu listinu: ${e?.message || 'neznáma chyba'}`;
      this.entries = [];
    } finally {
      this.loading = false;
    }
  }

  private async assignBestSlot(appointmentId: string) {
    this.infoMessage = undefined;
    this.errorMessage = undefined;
    try {
      const response = await fetch(`${this.apiBase}/specialist-booking/${this.clinicId}/appointments/${appointmentId}/assign-best-slot`, {
        method: 'POST',
      });
      const result = (await response.json()) as AssignResult;
      if (response.ok || response.status === 202) {
        this.infoMessage = result.message;
        await this.reload();
        return;
      }
      this.errorMessage = result.message || `Nepodarilo sa priradiť termín (${response.status})`;
    } catch (e: any) {
      this.errorMessage = `Nepodarilo sa priradiť termín: ${e?.message || 'neznáma chyba'}`;
    }
  }

  render() {
    return (
      <Host>
        <section class="hero compact">
          <p class="eyebrow">Rozšírenie funkcionality</p>
          <h1>Inteligentná čakacia listina</h1>
          <div class="hero-actions">
            <md-outlined-button onClick={() => this.appointmentsOpened.emit('appointments')}>Objednávky</md-outlined-button>
            <md-filled-button onClick={() => this.reload()}>Obnoviť</md-filled-button>
          </div>
        </section>

        {this.loading ? <md-linear-progress indeterminate></md-linear-progress> : null}
        {this.errorMessage ? <div class="error">{this.errorMessage}</div> : null}
        {this.infoMessage ? <div class="info">{this.infoMessage}</div> : null}

        <md-list>
          {this.entries.map(entry => (
            <md-list-item>
              <div slot="headline">{entry.patientName}</div>
              <div slot="supporting-text">
                {entry.examinationType} · zaradené {new Date(entry.requestedAt).toLocaleString('sk-SK')}
              </div>
              <md-filled-tonal-button slot="end" onClick={() => this.assignBestSlot(entry.appointmentId)}>
                Skúsiť priradiť termín
              </md-filled-tonal-button>
            </md-list-item>
          ))}
        </md-list>

        {!this.loading && this.entries.length === 0 ? <p class="empty">Čakacia listina je prázdna.</p> : null}
      </Host>
    );
  }
}
