import { newSpecPage } from '@stencil/core/testing';
import { SpecialistBookingAppointmentEditor } from '../specialist-booking-appointment-editor';

describe('specialist-booking-appointment-editor', () => {
  it('buttons shall be of different type', async () => {
    const page = await newSpecPage({
      components: [SpecialistBookingAppointmentEditor],
      html: `<specialist-booking-appointment-editor appointment-id="@new"></specialist-booking-appointment-editor>`,
    });
    let items: any = await page.root.shadowRoot.querySelectorAll('.save-btn');
    expect(items.length).toEqual(1);
    items = await page.root.shadowRoot.querySelectorAll('.back-link');
    expect(items.length).toEqual(1);
    items = await page.root.shadowRoot.querySelectorAll('.delete-btn');
    expect(items.length).toEqual(0); // delete button hidden for new appointments
  });
});
