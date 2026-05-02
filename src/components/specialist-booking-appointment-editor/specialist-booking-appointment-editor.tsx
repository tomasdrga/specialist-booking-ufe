import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';

@Component({
  tag: 'specialist-booking-appointment-editor',
  styleUrl: 'specialist-booking-appointment-editor.css',
  shadow: true,
})
export class SpecialistBookingAppointmentEditor {
  @Prop() appointmentId: string;

  @Event({ eventName: 'editor-closed' }) editorClosed: EventEmitter<string>;

  @State() private duration = 30;

  private handleSliderInput(event: Event) {
    this.duration = +(event.target as HTMLInputElement).value;
  }

  render() {
    return (
      <Host>
        <md-filled-text-field label="Meno a priezvisko pacienta">
          <md-icon slot="leading-icon">person</md-icon>
        </md-filled-text-field>

        <md-filled-text-field label="Email pacienta">
          <md-icon slot="leading-icon">mail</md-icon>
        </md-filled-text-field>

        <md-filled-text-field label="Preferovaný termín" disabled>
          <md-icon slot="leading-icon">watch_later</md-icon>
        </md-filled-text-field>

        <md-filled-select label="Typ vyšetrenia">
          <md-icon slot="leading-icon">medical_services</md-icon>
          <md-select-option value="cardio"><div slot="headline">Kardiologické vyšetrenie</div></md-select-option>
          <md-select-option value="neuro"><div slot="headline">Neurologická konzultácia</div></md-select-option>
          <md-select-option value="derma"><div slot="headline">Dermatologická kontrola</div></md-select-option>
          <md-select-option value="ortho"><div slot="headline">Ortopedické vyšetrenie</div></md-select-option>
        </md-filled-select>

        <div class="duration-slider">
          <span class="label">Predpokladaná doba trvania:&nbsp; </span>
          <span class="label">{this.duration}</span>
          <span class="label">&nbsp;minút</span>
          <md-slider min="10" max="90" value={this.duration} ticks labeled oninput={this.handleSliderInput.bind(this)}></md-slider>
        </div>

        <md-divider></md-divider>
        <div class="actions">
          <md-filled-tonal-button id="delete" onClick={() => this.editorClosed.emit('delete')}>
            <md-icon slot="icon">delete</md-icon>
            Zrušiť objednávku
          </md-filled-tonal-button>
          <span class="stretch-fill"></span>
          <md-outlined-button id="cancel" onClick={() => this.editorClosed.emit('cancel')}>Späť</md-outlined-button>
          <md-filled-button id="confirm" onClick={() => this.editorClosed.emit('store')}>
            <md-icon slot="icon">save</md-icon>
            Uložiť
          </md-filled-button>
        </div>
      </Host>
    );
  }
}
