import { newSpecPage } from '@stencil/core/testing';
import { SpecialistBookingOverview } from '../specialist-booking-overview';

describe('specialist-booking-overview', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [SpecialistBookingOverview],
      html: `<specialist-booking-overview></specialist-booking-overview>`,
    });

    const bookingOverview = page.rootInstance as SpecialistBookingOverview;
    const expectedAppointments = bookingOverview?.appointments?.length;

    const items = page.root.shadowRoot.querySelectorAll('md-list-item');
    expect(items.length).toEqual(expectedAppointments);
  });
});
