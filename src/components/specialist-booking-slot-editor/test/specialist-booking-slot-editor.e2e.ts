import { newE2EPage } from '@stencil/core/testing';

describe('specialist-booking-slot-editor', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<specialist-booking-slot-editor></specialist-booking-slot-editor>');

    const element = await page.find('specialist-booking-slot-editor');
    expect(element).toHaveClass('hydrated');
  });
});
