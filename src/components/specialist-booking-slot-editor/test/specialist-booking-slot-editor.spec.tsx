import { newSpecPage } from '@stencil/core/testing';
import { SpecialistBookingSlotEditor } from '../specialist-booking-slot-editor';

describe('specialist-booking-slot-editor', () => {
  it('renders actions', async () => {
    const page = await newSpecPage({
      components: [SpecialistBookingSlotEditor],
      html: `<specialist-booking-slot-editor slot-id="@new" clinic-id="test-clinic" api-base="http://test/api"></specialist-booking-slot-editor>`,
    });

    let buttons = page.root.shadowRoot.querySelectorAll('.back-link');
    expect(buttons.length).toEqual(1);
    buttons = page.root.shadowRoot.querySelectorAll('.save-btn');
    expect(buttons.length).toEqual(1);
    buttons = page.root.shadowRoot.querySelectorAll('.delete-btn');
    expect(buttons.length).toEqual(0);
  });
});
