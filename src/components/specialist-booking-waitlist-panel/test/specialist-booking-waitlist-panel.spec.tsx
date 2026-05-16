import { newSpecPage } from '@stencil/core/testing';
import { SpecialistBookingWaitlistPanel } from '../specialist-booking-waitlist-panel';

describe('specialist-booking-waitlist-panel', () => {
  it('renders empty state', async () => {
    const page = await newSpecPage({
      components: [SpecialistBookingWaitlistPanel],
      html: `<specialist-booking-waitlist-panel clinic-id="test" api-base="/api"></specialist-booking-waitlist-panel>`,
    });
    expect(page.root).toBeTruthy();
  });
});
