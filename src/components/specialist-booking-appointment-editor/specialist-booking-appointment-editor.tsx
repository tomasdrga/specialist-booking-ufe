import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { Appointment, Configuration, SpecialistBookingApi } from '../../api/specialist-booking';

@Component({
  tag: 'specialist-booking-appointment-editor',
  styleUrl: 'specialist-booking-appointment-editor.css',
  shadow: true,
})
export class SpecialistBookingAppointmentEditor {
  @Prop() appointmentId: string;
  @Prop() apiBase: string;
  @Prop() clinicId: string;

  @Event({ eventName: 'editor-closed' }) editorClosed: EventEmitter<string>;

  @State() appointment: Appointment;
  @State() errorMessage: string;
  @State() private duration = 30;

  private formElement: HTMLFormElement;

  async componentWillLoad() {
    this.appointment = await this.getAppointmentAsync();
    this.duration = this.appointment?.durationMinutes || 30;
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
        startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        durationMinutes: 30,
        examinationType: 'Kardiologické vyšetrenie',
        status: 'requested',
      };
    }

    try {
      const response = await this.api().getAppointmentRaw({ clinicId: this.clinicId, appointmentId: this.appointmentId });
      if (response.raw.status < 299) {
        return await response.value();
      }
      this.errorMessage = `Nepodarilo sa načítať objednávku: ${response.raw.statusText}`;
    } catch (err: any) {
      this.errorMessage = `Nepodarilo sa načítať objednávku: ${err.message || 'neznáma chyba'}`;
    }
    return undefined;
  }

  private handleSliderInput(event: Event) {
    this.duration = +(event.target as HTMLInputElement).value;
    if (this.appointment) {
      this.appointment.durationMinutes = this.duration;
    }
  }

  private handleInputEvent(event: InputEvent): string {
    return (event.target as HTMLInputElement).value;
  }

  private validateForm(): boolean {
    for (let i = 0; i < this.formElement.children.length; i++) {
      const element = this.formElement.children[i] as HTMLElement & { reportValidity?: () => boolean };
      if (element.reportValidity && !element.reportValidity()) {
        return false;
      }
    }
    return true;
  }

  private async updateAppointment() {
    if (!this.validateForm()) {
      return;
    }

    try {
      const response = this.appointmentId === '@new'
        ? await this.api().createAppointmentRaw({ clinicId: this.clinicId, appointment: this.appointment })
        : await this.api().updateAppointmentRaw({ clinicId: this.clinicId, appointmentId: this.appointmentId, appointment: this.appointment });

      if (response.raw.status < 299) {
        this.editorClosed.emit('store');
      } else {
        this.errorMessage = `Nepodarilo sa uložiť objednávku: ${response.raw.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Nepodarilo sa uložiť objednávku: ${err.message || 'neznáma chyba'}`;
    }
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
      return (
        <Host>
          <div class="error">{this.errorMessage}</div>
        </Host>
      );
    }

    return (
      <Host>
        <form ref={el => (this.formElement = el)}>
          <md-filled-text-field label="Meno a priezvisko pacienta" required value={this.appointment?.patientName}
            oninput={(ev: InputEvent) => { if (this.appointment) this.appointment.patientName = this.handleInputEvent(ev); }}>
            <md-icon slot="leading-icon">person</md-icon>
          </md-filled-text-field>

          <md-filled-text-field label="Registračné číslo pacienta" required value={this.appointment?.patientId}
            oninput={(ev: InputEvent) => { if (this.appointment) this.appointment.patientId = this.handleInputEvent(ev); }}>
            <md-icon slot="leading-icon">fingerprint</md-icon>
          </md-filled-text-field>

          <md-filled-text-field label="Email pacienta" type="email" value={this.appointment?.patientEmail}
            oninput={(ev: InputEvent) => { if (this.appointment) this.appointment.patientEmail = this.handleInputEvent(ev); }}>
            <md-icon slot="leading-icon">mail</md-icon>
          </md-filled-text-field>

          <md-filled-text-field label="Odosielajúci lekár" value={this.appointment?.referringDoctor}
            oninput={(ev: InputEvent) => { if (this.appointment) this.appointment.referringDoctor = this.handleInputEvent(ev); }}>
            <md-icon slot="leading-icon">medical_services</md-icon>
          </md-filled-text-field>

          <md-filled-select label="Typ vyšetrenia" value={this.appointment?.examinationType}
            oninput={(ev: InputEvent) => { if (this.appointment) this.appointment.examinationType = this.handleInputEvent(ev); }}>
            <md-icon slot="leading-icon">medical_services</md-icon>
            <md-select-option value="Kardiologické vyšetrenie"><div slot="headline">Kardiologické vyšetrenie</div></md-select-option>
            <md-select-option value="Neurologická konzultácia"><div slot="headline">Neurologická konzultácia</div></md-select-option>
            <md-select-option value="Dermatologická kontrola"><div slot="headline">Dermatologická kontrola</div></md-select-option>
            <md-select-option value="Ortopedické vyšetrenie"><div slot="headline">Ortopedické vyšetrenie</div></md-select-option>
          </md-filled-select>

          <md-filled-select label="Stav objednávky" value={this.appointment?.status}
            oninput={(ev: InputEvent) => { if (this.appointment) this.appointment.status = this.handleInputEvent(ev); }}>
            <md-icon slot="leading-icon">pending_actions</md-icon>
            <md-select-option value="requested"><div slot="headline">Čaká na potvrdenie</div></md-select-option>
            <md-select-option value="confirmed"><div slot="headline">Potvrdené</div></md-select-option>
            <md-select-option value="completed"><div slot="headline">Ukončené</div></md-select-option>
            <md-select-option value="cancelled"><div slot="headline">Zrušené</div></md-select-option>
          </md-filled-select>
        </form>

        <div class="duration-slider">
          <span class="label">Predpokladaná doba trvania:&nbsp; </span>
          <span class="label">{this.duration}</span>
          <span class="label">&nbsp;minút</span>
          <md-slider min="10" max="90" value={this.duration} ticks labeled oninput={this.handleSliderInput.bind(this)}></md-slider>
        </div>

        <md-divider></md-divider>
        <div class="actions">
          <md-filled-tonal-button id="delete" disabled={!this.appointment || this.appointment?.id === '@new'} onClick={() => this.deleteAppointment()}>
            <md-icon slot="icon">delete</md-icon>
            Zrušiť objednávku
          </md-filled-tonal-button>
          <span class="stretch-fill"></span>
          <md-outlined-button id="cancel" onClick={() => this.editorClosed.emit('cancel')}>Späť</md-outlined-button>
          <md-filled-button id="confirm" onClick={() => this.updateAppointment()}>
            <md-icon slot="icon">save</md-icon>
            Uložiť
          </md-filled-button>
        </div>
      </Host>
    );
  }
}
