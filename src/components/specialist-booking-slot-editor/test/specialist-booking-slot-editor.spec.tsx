import { newSpecPage } from '@stencil/core/testing';
import { SpecialistBookingSlotEditor } from '../specialist-booking-slot-editor';

describe('specialist-booking-slot-editor', () => {
  it('renders actions', async () => {
    const page = await newSpecPage({
      components: [SpecialistBookingSlotEditor],
      html: `<specialist-booking-slot-editor slot-id="@new" clinic-id="test-clinic" api-base="http://test/api"></specialist-booking-slot-editor>`,
    });

    const buttons = page.root.shadowRoot.querySelectorAll('md-filled-button, md-outlined-button, md-filled-tonal-button');
    expect(buttons.length).toEqual(3);
  });
});
