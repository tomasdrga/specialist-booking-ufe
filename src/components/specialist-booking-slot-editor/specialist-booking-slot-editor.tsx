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
  private readonly durations = [15, 30, 60];
  private readonly capacities = [1, 2, 3, 4, 5, 6];

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

  private toDatetimeLocal(date?: Date): string {
    if (!date) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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
        <button class="back-link" onClick={() => this.editorClosed.emit('cancel')}>
          <md-icon>arrow_back</md-icon>
          Späť
        </button>

        <header class="page-header">
          <div>
            <p class="eyebrow">Správa termínov ambulancie</p>
            <h1>{isNew ? 'Nový termín' : 'Upraviť termín'}</h1>
          </div>
        </header>

        <div class="card">
          <form ref={el => (this.formElement = el)}>
            <div class="datetime-field">
              <md-icon>schedule</md-icon>
              <div class="datetime-inner">
                <span class="datetime-label">Začiatok termínu *</span>
                <input
                  type="datetime-local"
                  class="datetime-input"
                  value={this.toDatetimeLocal(this.slot?.startsAt)}
                  onInput={(ev: InputEvent) => { if (this.slot) this.slot.startsAt = new Date((ev.target as HTMLInputElement).value); }}
                  required
                />
              </div>
            </div>

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

          <div class="pills-section">
            <div class="pills-group">
              <span class="pills-label">
                <md-icon>schedule</md-icon>
                Trvanie
              </span>
              <div class="pills">
                {this.durations.map(d => (
                  <button
                    class={{ pill: true, active: this.duration === d }}
                    onClick={() => { this.duration = d; if (this.slot) this.slot.durationMinutes = d; }}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>

            <div class="pills-group">
              <span class="pills-label">
                <md-icon>group</md-icon>
                Kapacita
              </span>
              <div class="pills">
                {this.capacities.map(c => (
                  <button
                    class={{ pill: true, active: this.capacity === c }}
                    onClick={() => { this.capacity = c; if (this.slot) this.slot.capacity = c; }}
                  >
                    {c}
                  </button>
                ))}
              </div>
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
