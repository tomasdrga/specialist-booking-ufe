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
      if (response.status === 404) {
        this.entries = [];
        return;
      }
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
        <button class="back-link" onClick={() => this.appointmentsOpened.emit('appointments')}>
          <md-icon>arrow_back</md-icon>
          Objednávky
        </button>

        <section class="hero">
          <div>
            <p class="eyebrow">Pracovný zoznam ambulancie</p>
            <h1>Čakajúce žiadosti</h1>
          </div>
          <div class="hero-actions">
            <button class="hero-secondary" onClick={() => this.reload()}>
              <md-icon>refresh</md-icon>
              Obnoviť
            </button>
          </div>
        </section>

        <div class="flow-note">
          <strong>Čakacia listina:</strong> pacienti, ktorých systém zatiaľ nevedel automaticky priradiť do vhodného termínu. Po vytvorení alebo uvoľnení kapacity môžete skúsiť priradenie znova.
        </div>

        {this.loading ? <md-linear-progress indeterminate></md-linear-progress> : null}

        {this.errorMessage ? <div class="error-banner">{this.errorMessage}</div> : null}
        {this.infoMessage ? <div class="info-banner">{this.infoMessage}</div> : null}

        <div class="panel">
          <div class="panel-heading">
            <span class="icon-badge"><md-icon>hourglass_top</md-icon></span>
            <div>
              <p class="label">Čakacia listina</p>
              <h2>Bez voľného termínu</h2>
            </div>
          </div>

          <div class="waitlist">
            {!this.loading && this.entries.length === 0 ? (
              <p class="empty-msg">Čakacia listina je prázdna.</p>
            ) : (
              this.entries.map(entry => (
                <div class="waitlist-row">
                  <md-icon class="row-icon">person</md-icon>
                  <div class="row-text">
                    <span class="row-name">{entry.patientName}</span>
                    <span class="row-detail">
                      {entry.examinationType + ' · zaradené ' + new Date(entry.requestedAt).toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Host>
    );
  }
}
