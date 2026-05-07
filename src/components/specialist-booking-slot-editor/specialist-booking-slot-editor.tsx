import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { Configuration, SpecialistBookingApi, TimeSlot } from '../../api/specialist-booking';

@Component({
  tag: 'specialist-booking-slot-editor',
  styleUrl: 'specialist-booking-slot-editor.css',
  shadow: true,
})
export class SpecialistBookingSlotEditor {
  @Prop() slotId: string;
  @Prop() apiBase: string;
  @Prop() clinicId: string;

  @Event({ eventName: 'editor-closed' }) editorClosed: EventEmitter<string>;

  @State() slot: TimeSlot;
  @State() errorMessage: string;
  @State() private duration = 30;
  @State() private capacity = 1;

  private formElement: HTMLFormElement;

  async componentWillLoad() {
    this.slot = await this.getSlotAsync();
    this.duration = this.slot?.durationMinutes || 30;
    this.capacity = this.slot?.capacity || 1;
  }

  private api() {
    return new SpecialistBookingApi(new Configuration({ basePath: this.apiBase }));
  }

  private async getSlotAsync(): Promise<TimeSlot> {
    if (this.slotId === '@new') {
      return {
        id: '@new',
        startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        durationMinutes: 30,
        capacity: 1,
        booked: 0,
        examinationType: 'Kardiologické vyšetrenie',
        urgentBlocked: false,
      };
    }

    try {
      const response = await this.api().getTimeSlotRaw({ clinicId: this.clinicId, slotId: this.slotId });
      if (response.raw.status < 299) {
        return await response.value();
      }
      this.errorMessage = `Nepodarilo sa načítať termín: ${response.raw.statusText}`;
    } catch (err: any) {
      this.errorMessage = `Nepodarilo sa načítať termín: ${err.message || 'neznáma chyba'}`;
    }
    return undefined;
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

  private value(event: InputEvent): string {
    return (event.target as HTMLInputElement).value;
  }

  private async updateSlot() {
    if (!this.validateForm()) return;

    try {
      const response = this.slotId === '@new'
        ? await this.api().createTimeSlotRaw({ clinicId: this.clinicId, timeSlot: this.slot })
        : await this.api().updateTimeSlotRaw({ clinicId: this.clinicId, slotId: this.slotId, timeSlot: this.slot });

      if (response.raw.status < 299) {
        this.editorClosed.emit('store');
      } else {
        this.errorMessage = `Nepodarilo sa uložiť termín: ${response.raw.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Nepodarilo sa uložiť termín: ${err.message || 'neznáma chyba'}`;
    }
  }

  private async deleteSlot() {
    if (this.slotId === '@new') {
      this.editorClosed.emit('cancel');
      return;
    }

    try {
      const response = await this.api().deleteTimeSlotRaw({ clinicId: this.clinicId, slotId: this.slotId });
      if (response.raw.status < 299) {
        this.editorClosed.emit('delete');
      } else {
        this.errorMessage = `Nepodarilo sa zmazať termín: ${response.raw.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Nepodarilo sa zmazať termín: ${err.message || 'neznáma chyba'}`;
    }
  }

  render() {
    if (this.errorMessage) {
      return <Host><div class="error">{this.errorMessage}</div></Host>;
    }

    const isNew = this.slotId === '@new';
    const selectStyle = {
      '--md-filled-select-container-color': '#ffffff',
      '--md-sys-color-surface-container-highest': '#ffffff',
      '--md-sys-color-primary': '#0d9488',
      '--md-sys-color-secondary-container': '#f0fdfa',
      '--md-filled-select-hover-state-layer-opacity': '0',
      '--md-filled-select-focus-state-layer-opacity': '0',
    } as any;

    return (
      <Host>
        <header class="page-header">
          <div>
            <p class="eyebrow">Správa termínov ambulancie</p>
            <h1>{isNew ? 'Nový termín' : 'Upraviť termín'}</h1>
          </div>
          <button class="back-btn" onClick={() => this.editorClosed.emit('cancel')}>
            <md-icon>arrow_back</md-icon>
            Späť
          </button>
        </header>

        <div class="card">
          <form ref={el => (this.formElement = el)}>
            <md-filled-text-field label="Začiatok termínu" required value={this.slot?.startsAt?.toISOString()}
              oninput={(ev: InputEvent) => { if (this.slot) this.slot.startsAt = new Date(this.value(ev)); }}>
              <md-icon slot="leading-icon">schedule</md-icon>
            </md-filled-text-field>

            <md-filled-select label="Typ vyšetrenia" value={this.slot?.examinationType}
              style={selectStyle}
              oninput={(ev: InputEvent) => { if (this.slot) this.slot.examinationType = this.value(ev); }}>
              <md-icon slot="leading-icon">medical_services</md-icon>
              <md-select-option value="Kardiologické vyšetrenie"><div slot="headline">Kardiologické vyšetrenie</div></md-select-option>
              <md-select-option value="Neurologická konzultácia"><div slot="headline">Neurologická konzultácia</div></md-select-option>
              <md-select-option value="Dermatologická kontrola"><div slot="headline">Dermatologická kontrola</div></md-select-option>
              <md-select-option value="Ortopedické vyšetrenie"><div slot="headline">Ortopedické vyšetrenie</div></md-select-option>
            </md-filled-select>

            <md-filled-select label="Urgentný blok" value={this.slot?.urgentBlocked ? 'true' : 'false'}
              style={selectStyle}
              oninput={(ev: InputEvent) => { if (this.slot) this.slot.urgentBlocked = this.value(ev) === 'true'; }}>
              <md-icon slot="leading-icon">emergency</md-icon>
              <md-select-option value="false"><div slot="headline">Dostupné pre objednávanie</div></md-select-option>
              <md-select-option value="true"><div slot="headline">Blokované pre urgentný prípad</div></md-select-option>
            </md-filled-select>
          </form>

          <div class="slider-section">
            <div class="slider-row">
              <span class="slider-label">
                <md-icon>schedule</md-icon>
                Trvanie: <strong>{this.duration} min</strong>
              </span>
              <md-slider min="10" max="120" value={this.duration} ticks labeled
                oninput={(ev: InputEvent) => { this.duration = +this.value(ev); if (this.slot) this.slot.durationMinutes = this.duration; }}>
              </md-slider>
            </div>
            <div class="slider-row">
              <span class="slider-label">
                <md-icon>group</md-icon>
                Kapacita: <strong>{this.capacity}</strong>
              </span>
              <md-slider min="1" max="6" value={this.capacity} ticks labeled
                oninput={(ev: InputEvent) => { this.capacity = +this.value(ev); if (this.slot) this.slot.capacity = this.capacity; }}>
              </md-slider>
            </div>
          </div>
        </div>

        <div class="actions">
          {!isNew && (
            <button class="delete-btn" onClick={() => this.deleteSlot()}>
              <md-icon>delete</md-icon>
              Zmazať termín
            </button>
          )}
          <span class="stretch-fill"></span>
          <button class="save-btn" onClick={() => this.updateSlot()}>
            <md-icon>save</md-icon>
            Uložiť
          </button>
        </div>
      </Host>
    );
  }
}
