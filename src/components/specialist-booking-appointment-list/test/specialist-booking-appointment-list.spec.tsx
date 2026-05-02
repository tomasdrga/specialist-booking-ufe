import { newSpecPage } from '@stencil/core/testing';
import { SpecialistBookingAppointmentList } from '../specialist-booking-appointment-list';
import { Appointment, TimeSlot } from '../../../api/specialist-booking/models';
import fetchMock from 'jest-fetch-mock';

describe('specialist-booking-appointment-list', () => {
  const sampleAppointments: Appointment[] = [
    {
      id: 'apt-1',
      patientId: 'p-1',
      patientName: 'Juraj Prvý',
      startsAt: new Date('2024-02-03T12:00:00Z'),
      durationMinutes: 20,
      examinationType: 'Kardiológia',
      status: 'confirmed',
    },
    {
      id: 'apt-2',
      patientId: 'p-2',
      patientName: 'Jana Druhá',
      startsAt: new Date('2024-02-03T13:00:00Z'),
      durationMinutes: 30,
      examinationType: 'Neurológia',
      status: 'requested',
    },
  ];

  const sampleSlots: TimeSlot[] = [
    {
      id: 'slot-1',
      startsAt: new Date('2024-02-03T12:00:00Z'),
      durationMinutes: 20,
      capacity: 2,
      booked: 1,
      examinationType: 'Kardiológia',
      urgentBlocked: false,
    },
  ];

  beforeAll(() => {
    fetchMock.enableMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  it('renders sample appointments', async () => {
    fetchMock.mockResponses(JSON.stringify(sampleAppointments), JSON.stringify(sampleSlots));

    const page = await newSpecPage({
      components: [SpecialistBookingAppointmentList],
      html: `<specialist-booking-appointment-list clinic-id="test-clinic" api-base="http://test/api"></specialist-booking-appointment-list>`,
    });

    const appointmentList = page.rootInstance as SpecialistBookingAppointmentList;
    await page.waitForChanges();

    const items = page.root.shadowRoot.querySelectorAll('md-list-item');
    expect(appointmentList?.appointments?.length).toEqual(sampleAppointments.length);
    expect(items.length).toEqual(sampleAppointments.length);
  });

  it('renders error message on network issues', async () => {
    fetchMock.mockRejectOnce(new Error('Network Error'));

    const page = await newSpecPage({
      components: [SpecialistBookingAppointmentList],
      html: `<specialist-booking-appointment-list clinic-id="test-clinic" api-base="http://test/api"></specialist-booking-appointment-list>`,
    });

    await page.waitForChanges();

    const errorMessage = page.root.shadowRoot.querySelectorAll('.error');
    const items = page.root.shadowRoot.querySelectorAll('md-list-item');
    expect(errorMessage.length).toBeGreaterThanOrEqual(1);
    expect(items.length).toEqual(0);
  });
});
