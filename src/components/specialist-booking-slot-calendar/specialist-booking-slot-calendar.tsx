import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { Configuration, SpecialistBookingApi, TimeSlot } from '../../api/specialist-booking';

@Component({
  tag: 'specialist-booking-slot-calendar',
  styleUrl: 'specialist-booking-slot-calendar.css',
  shadow: true,
})
export class SpecialistBookingSlotCalendar {
  @Event({ eventName: 'slot-clicked' }) slotClicked: EventEmitter<string>;
  @Event({ eventName: 'slot-create-clicked' }) slotCreateClicked: EventEmitter<string>;
  @Event({ eventName: 'appointments-opened' }) appointmentsOpened: EventEmitter<string>;

  @Prop() apiBase: string;
  @Prop() clinicId: string;
  @State() errorMessage: string;

  timeSlots: TimeSlot[] = [];

  async componentWillLoad() {
    this.timeSlots = await this.getTimeSlotsAsync();
  }

  private api() {
    return new SpecialistBookingApi(new Configuration({ basePath: this.apiBase }));
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

  private groupedSlots() {
    return this.timeSlots.reduce((acc, slot) => {
      const key = slot.startsAt.toLocaleDateString('sk-SK', { weekday: 'long', day: 'numeric', month: 'long' });
      acc[key] = [...(acc[key] || []), slot];
      return acc;
    }, {} as Record<string, TimeSlot[]>);
  }

  render() {
    const groups = this.groupedSlots();
    return (
      <Host>
        <section class="hero compact">
          <p class="eyebrow">Administrácia ambulancie</p>
          <h1>Kalendár dostupných termínov</h1>
          <div class="hero-actions">
            <md-outlined-button onClick={() => this.appointmentsOpened.emit('appointments')}>Objednávky</md-outlined-button>
            <md-filled-button onClick={() => this.slotCreateClicked.emit('@new')}>
              <md-icon slot="icon">add</md-icon>
              Nový termín
            </md-filled-button>
          </div>
        </section>

        {this.errorMessage ? (
          <div class="error">{this.errorMessage}</div>
        ) : (
          <section class="calendar-panel">
            {Object.entries(groups).map(([day, slots]) => (
              <div class="day-column">
                <h2>{day}</h2>
                {slots.map(slot => {
                  const full = slot.booked >= slot.capacity;
                  return (
                    <button class={{ slot: true, full, blocked: slot.urgentBlocked }} onClick={() => this.slotClicked.emit(slot.id)}>
                      <span class="time">{slot.startsAt.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span class="type">{slot.examinationType}</span>
                      <span class="capacity">{slot.urgentBlocked ? 'Urgent blok' : `${slot.booked}/${slot.capacity} obsadené · ${slot.durationMinutes} min`}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </section>
        )}
      </Host>
    );
  }
}
