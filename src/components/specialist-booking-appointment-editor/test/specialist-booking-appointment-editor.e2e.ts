import { newE2EPage } from '@stencil/core/testing';

describe('specialist-booking-appointment-editor', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<specialist-booking-appointment-editor></specialist-booking-appointment-editor>');

    const element = await page.find('specialist-booking-appointment-editor');
    expect(element).toHaveClass('hydrated');
  });
});
