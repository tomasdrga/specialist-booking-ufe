import { newE2EPage } from '@stencil/core/testing';

describe('specialist-booking-app', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<specialist-booking-app></specialist-booking-app>');

    const element = await page.find('specialist-booking-app');
    expect(element).toHaveClass('hydrated');
  });
});
