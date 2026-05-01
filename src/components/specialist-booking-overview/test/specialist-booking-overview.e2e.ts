import { newE2EPage } from '@stencil/core/testing';

describe('specialist-booking-overview', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<specialist-booking-overview></specialist-booking-overview>');

    const element = await page.find('specialist-booking-overview');
    expect(element).toHaveClass('hydrated');
  });
});
