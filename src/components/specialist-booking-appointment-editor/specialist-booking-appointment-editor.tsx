import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { Appointment, AppointmentStatusEnum, Configuration, SpecialistBookingApi, TimeSlot } from '../../api/specialist-booking';

@Component({
  tag: 'specialist-booking-appointment-editor',
  styleUrl: 'specialist-booking-appointment-editor.css',
  shadow: true,
})
export class SpecialistBookingAppointmentEditor {
  @Prop() appointmentId: string;
  @Prop() apiBase: string;
  @Prop() clinicId: string;
  @Prop() prefillSlot: TimeSlot | null = null;
  @Prop() role: 'patient' | 'doctor' = 'patient';

  @Event({ eventName: 'editor-closed' }) editorClosed: EventEmitter<string>;

  @State() appointment: Appointment;
  @State() errorMessage: string;
  @State() private duration = 30;

  private formElement: HTMLFormElement;
  private readonly durations = [15, 30, 60];

  async componentWillLoad() {
    this.appointment = await this.getAppointmentAsync();
    this.duration = this.appointment?.durationMinutes ?? this.prefillSlot?.durationMinutes ?? 30;
  }

  private api() {
    return new SpecialistBookingApi(new Configuration({ basePath: this.apiBase }));
  }

  private async getAppointmentAsync(): Promise<Appointment> {
    if (this.appointmentId === '@new') {
      return {
        id: '@new',
        patientId: '',
        patientName: '',
        patientEmail: '',
        startsAt: this.prefillSlot?.startsAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000),
        durationMinutes: this.prefillSlot?.durationMinutes ?? 30,
        examinationType: this.prefillSlot?.examinationType ?? 'Kardiologické vyšetrenie',
        status: AppointmentStatusEnum.Requested,
      };
    }

    try {
      const response = await this.api().getAppointmentRaw({ clinicId: this.clinicId, appointmentId: this.appointmentId });
      if (response.raw.status < 299) return await response.value();
      this.errorMessage = `Nepodarilo sa načítať objednávku: ${response.raw.statusText}`;
    } catch (err: any) {
      this.errorMessage = `Nepodarilo sa načítať objednávku: ${err.message || 'neznáma chyba'}`;
    }
    return undefined;
  }

  private handleInputEvent(event: InputEvent): string {
    return (event.target as HTMLInputElement).value;
  }

  private toDatetimeLocal(date?: Date): string {
    if (!date) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  private validateForm(): boolean {
    for (let i = 0; i < this.formElement.children.length; i++) {
      const element = this.formElement.children[i] as HTMLElement & { reportValidity?: () => boolean };
      if (element.reportValidity && !element.reportValidity()) return false;
    }
    return true;
  }

  private async updateAppointment(overrideStatus?: AppointmentStatusEnum) {
    if (!overrideStatus && !this.validateForm()) return;
    const payload = { ...this.appointment };
    if (overrideStatus) {
      payload.status = overrideStatus;
    } else if (this.role === 'patient') {
      payload.status = AppointmentStatusEnum.Requested;
      if (!payload.patientId) {
        const rnd = (digits: number) => Math.floor(Math.random() * Math.pow(10, digits)).toString().padStart(digits, '0');
        payload.patientId = `${rnd(6)}/${rnd(4)}`;
      }
    }
    try {
      const response = this.appointmentId === '@new'
        ? await this.api().createAppointmentRaw({ clinicId: this.clinicId, appointment: payload })
        : await this.api().updateAppointmentRaw({ clinicId: this.clinicId, appointmentId: this.appointmentId, appointment: payload });

      if (response.raw.status < 299) {
        if (overrideStatus) this.appointment = { ...this.appointment, status: overrideStatus };
        else this.editorClosed.emit('store');
      } else {
        this.errorMessage = `Nepodarilo sa uložiť objednávku: ${response.raw.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Nepodarilo sa uložiť objednávku: ${err.message || 'neznáma chyba'}`;
    }
  }

  private renderStatusPanel() {
    const status = this.appointment?.status;
    const statusMeta: Record<string, { label: string; cls: string; icon: string }> = {
      requested:  { label: 'Čaká na potvrdenie', cls: 'requested',  icon: 'hourglass_top' },
      confirmed:  { label: 'Potvrdené',           cls: 'confirmed',  icon: 'check_circle' },
      completed:  { label: 'Ukončené',             cls: 'completed',  icon: 'task_alt' },
      cancelled:  { label: 'Zrušené',              cls: 'cancelled',  icon: 'cancel' },
    };
    const current = statusMeta[status] ?? { label: status, cls: 'requested', icon: 'help' };

    const actions: { label: string; status: AppointmentStatusEnum; icon: string; cls: string }[] = [];
    if (status === 'requested') {
      actions.push({ label: 'Potvrdiť', status: AppointmentStatusEnum.Confirmed, icon: 'check_circle', cls: 'action-confirm' });
    } else if (status === 'confirmed') {
      actions.push({ label: 'Ukončiť', status: AppointmentStatusEnum.Completed, icon: 'task_alt', cls: 'action-complete' });
    }

    return (
      <div class="status-panel">
        <div class={`status-badge status-${current.cls}`}>
          <md-icon>{current.icon}</md-icon>
          {current.label}
        </div>
      </div>
    );
  }

  private renderStatusAction() {
    const status = this.appointment?.status;
    if (status === 'requested') {
      return (
        <button class="status-action-btn action-confirm" onClick={() => this.updateAppointment(AppointmentStatusEnum.Confirmed)}>
          <md-icon>check_circle</md-icon>
          Potvrdiť
        </button>
      );
    }
    if (status === 'confirmed') {
      return (
        <button class="status-action-btn action-complete" onClick={() => this.updateAppointment(AppointmentStatusEnum.Completed)}>
          <md-icon>task_alt</md-icon>
          Ukončiť
        </button>
      );
    }
    return null;
  }

  private async deleteAppointment() {
    if (this.appointmentId === '@new') {
      this.editorClosed.emit('cancel');
      return;
    }
    try {
      const response = await this.api().deleteAppointmentRaw({ clinicId: this.clinicId, appointmentId: this.appointmentId });
      if (response.raw.status < 299) {
        this.editorClosed.emit('delete');
      } else {
        this.errorMessage = `Nepodarilo sa zrušiť objednávku: ${response.raw.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Nepodarilo sa zrušiť objednávku: ${err.message || 'neznáma chyba'}`;
    }
  }

  render() {
    if (this.errorMessage) {
      return <Host><div class="error">{this.errorMessage}</div></Host>;
    }

    const isNew = this.appointmentId === '@new';
    const patientMode = this.role === 'patient';

    return (
      <Host>
        <button class="back-link" onClick={() => this.editorClosed.emit('cancel')}>
          <md-icon>arrow_back</md-icon>
          Späť
        </button>

        <header class="page-header">
          <div>
            <p class="eyebrow">{patientMode ? 'Žiadosť o vyšetrenie' : 'Objednávka pacienta'}</p>
            <h1>{patientMode ? (isNew ? 'Požiadať o termín' : 'Detail mojej žiadosti') : (isNew ? 'Nová objednávka' : 'Upraviť objednávku')}</h1>
          </div>
          {!isNew && !patientMode && this.renderStatusPanel()}
        </header>

        <div class="card">
          {patientMode ? (
            <div class="workflow-note">
              <md-icon>info</md-icon>
              <span>Vyplňte základné údaje a preferovaný typ vyšetrenia. Stav objednávky nastaví ambulancia automaticky podľa dostupných termínov.</span>
            </div>
          ) : isNew ? (
            <div class="workflow-note">
              <md-icon>admin_panel_settings</md-icon>
              <span>Režim lekára: vytvorte novú objednávku pre pacienta.</span>
            </div>
          ) : null}
          <form ref={el => (this.formElement = el)}>
            <md-filled-text-field label="Meno a priezvisko pacienta" required value={this.appointment?.patientName}
              oninput={(ev: InputEvent) => { if (this.appointment) this.appointment.patientName = this.handleInputEvent(ev); }}>
              <md-icon slot="leading-icon">person</md-icon>
            </md-filled-text-field>

            {!patientMode && (
              <md-filled-text-field label="Registračné číslo pacienta" readonly value={this.appointment?.patientId}>
                <md-icon slot="leading-icon">fingerprint</md-icon>
              </md-filled-text-field>
            )}

            <md-filled-text-field label="Email pacienta" type="email" value={this.appointment?.patientEmail}
              oninput={(ev: InputEvent) => { if (this.appointment) this.appointment.patientEmail = this.handleInputEvent(ev); }}>
              <md-icon slot="leading-icon">mail</md-icon>
            </md-filled-text-field>

            <div class="datetime-field">
              <md-icon>schedule</md-icon>
              <div class="datetime-inner">
                <span class="datetime-label">{patientMode ? 'Preferovaný dátum a čas' : 'Začiatok objednávky *'}</span>
                <input
                  type="datetime-local"
                  class="datetime-input"
                  value={this.toDatetimeLocal(this.appointment?.startsAt)}
                  onInput={(ev: InputEvent) => { if (this.appointment) this.appointment.startsAt = new Date((ev.target as HTMLInputElement).value); }}
                  required
                />
              </div>
            </div>

            <md-filled-select label="Odosielajúci lekár" value={this.appointment?.referringDoctor ?? ''}
              style={{ '--md-filled-select-container-color': '#ffffff', '--md-sys-color-surface-container-highest': '#ffffff', '--md-sys-color-primary': '#0d9488', '--md-sys-color-secondary-container': '#f0fdfa', '--md-filled-select-hover-state-layer-opacity': '0', '--md-filled-select-focus-state-layer-opacity': '0' } as any}
              oninput={(ev: InputEvent) => { if (this.appointment) this.appointment.referringDoctor = this.handleInputEvent(ev); }}>
              <md-icon slot="leading-icon">medical_services</md-icon>
              <md-select-option value=""><div slot="headline">— bez odosielajúceho lekára —</div></md-select-option>
              <md-select-option value="MUDr. Jana Kováčová"><div slot="headline">MUDr. Jana Kováčová</div></md-select-option>
              <md-select-option value="MUDr. Peter Novák"><div slot="headline">MUDr. Peter Novák</div></md-select-option>
              <md-select-option value="MUDr. Mária Horváthová"><div slot="headline">MUDr. Mária Horváthová</div></md-select-option>
              <md-select-option value="MUDr. Tomáš Blaho"><div slot="headline">MUDr. Tomáš Blaho</div></md-select-option>
              <md-select-option value="MUDr. Eva Bartošová"><div slot="headline">MUDr. Eva Bartošová</div></md-select-option>
            </md-filled-select>

            <md-filled-select label="Typ vyšetrenia" value={this.appointment?.examinationType}
              style={{ '--md-filled-select-container-color': '#ffffff', '--md-sys-color-surface-container-highest': '#ffffff', '--md-sys-color-primary': '#0d9488', '--md-sys-color-secondary-container': '#f0fdfa', '--md-filled-select-hover-state-layer-opacity': '0', '--md-filled-select-focus-state-layer-opacity': '0' } as any}
              oninput={(ev: InputEvent) => { if (this.appointment) this.appointment.examinationType = this.handleInputEvent(ev); }}>
              <md-icon slot="leading-icon">medical_services</md-icon>
              <md-select-option value="Kardiologické vyšetrenie"><div slot="headline">Kardiologické vyšetrenie</div></md-select-option>
              <md-select-option value="Neurologická konzultácia"><div slot="headline">Neurologická konzultácia</div></md-select-option>
              <md-select-option value="Dermatologická kontrola"><div slot="headline">Dermatologická kontrola</div></md-select-option>
              <md-select-option value="Ortopedické vyšetrenie"><div slot="headline">Ortopedické vyšetrenie</div></md-select-option>
            </md-filled-select>

          </form>

          <div class="duration-section">
            <span class="duration-label">
              <md-icon>schedule</md-icon>
              Predpokladaná doba trvania
            </span>
            <div class="duration-pills">
              {this.durations.map(d => (
                <button
                  class={{ 'duration-pill': true, active: this.duration === d }}
                  onClick={() => {
                    this.duration = d;
                    if (this.appointment) this.appointment.durationMinutes = d;
                  }}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>
        </div>

        <div class="actions">
          {!isNew && (
            <button class="delete-btn" onClick={() => this.deleteAppointment()}>
              <md-icon>delete</md-icon>
              Zrušiť objednávku
            </button>
          )}
          {!isNew && !patientMode && this.renderStatusAction()}
          <span class="stretch-fill"></span>
          <button class="save-btn" onClick={() => this.updateAppointment()}>
            <md-icon>save</md-icon>
            {patientMode ? 'Odoslať žiadosť' : 'Uložiť'}
          </button>
        </div>
      </Host>
    );
  }
}
