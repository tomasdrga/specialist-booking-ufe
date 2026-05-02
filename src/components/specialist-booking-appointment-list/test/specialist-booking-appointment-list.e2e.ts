import { newE2EPage } from '@stencil/core/testing';

describe('specialist-booking-appointment-list', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<specialist-booking-appointment-list></specialist-booking-appointment-list>');

    const element = await page.find('specialist-booking-appointment-list');
    expect(element).toHaveClass('hydrated');
  });
});
