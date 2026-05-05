import { newE2EPage } from '@stencil/core/testing';

describe('specialist-booking-slot-calendar', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<specialist-booking-slot-calendar></specialist-booking-slot-calendar>');

    const element = await page.find('specialist-booking-slot-calendar');
    expect(element).toHaveClass('hydrated');
  });
});
