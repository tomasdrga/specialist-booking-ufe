import { newSpecPage } from '@stencil/core/testing';
import { SpecialistBookingOverview } from '../specialist-booking-overview';

describe('specialist-booking-overview', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [SpecialistBookingOverview],
      html: `<specialist-booking-overview></specialist-booking-overview>`,
    });
    expect(page.root).toEqualHtml(`
      <specialist-booking-overview>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </specialist-booking-overview>
    `);
  });
});
