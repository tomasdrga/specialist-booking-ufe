import { newSpecPage } from '@stencil/core/testing';
import { SpecialistBookingSlotCalendar } from '../specialist-booking-slot-calendar';
import { TimeSlot } from '../../../api/specialist-booking/models';
import fetchMock from 'jest-fetch-mock';

describe('specialist-booking-slot-calendar', () => {
  const sampleSlots: TimeSlot[] = [
    { id: 'slot-1', startsAt: new Date('2024-02-03T12:00:00Z'), durationMinutes: 30, capacity: 2, booked: 1, examinationType: 'Kardiológia', urgentBlocked: false },
    { id: 'slot-2', startsAt: new Date('2024-02-03T13:00:00Z'), durationMinutes: 45, capacity: 1, booked: 0, examinationType: 'Neurológia', urgentBlocked: true },
  ];

  beforeAll(() => fetchMock.enableMocks());
  afterEach(() => fetchMock.resetMocks());

  it('renders time slots', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(sampleSlots));
    const page = await newSpecPage({
      components: [SpecialistBookingSlotCalendar],
      html: `<specialist-booking-slot-calendar clinic-id="test-clinic" api-base="http://test/api"></specialist-booking-slot-calendar>`,
    });

    await page.waitForChanges();
    const items = page.root.shadowRoot.querySelectorAll('.slot');
    expect(items.length).toEqual(sampleSlots.length);
  });
});
