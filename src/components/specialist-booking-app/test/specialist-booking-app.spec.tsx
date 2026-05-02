import { newSpecPage } from '@stencil/core/testing';
import { SpecialistBookingApp } from '../specialist-booking-app';

describe('<specialist-booking-app>', () => {
  it('renders editor', async () => {
    const page = await newSpecPage({
      url: `http://localhost/appointment/@new`,
      components: [SpecialistBookingApp],
      html: `<specialist-booking-app base-path="/"></specialist-booking-app>`,
    });
    page.win.navigation = new EventTarget();
    const child = await page.root.shadowRoot.firstElementChild;
    expect(child.tagName.toLocaleLowerCase()).toEqual('specialist-booking-appointment-editor');
  });

  it('renders list', async () => {
    const page = await newSpecPage({
      url: `http://localhost/specialist-booking/`,
      components: [SpecialistBookingApp],
      html: `<specialist-booking-app base-path="/specialist-booking/"></specialist-booking-app>`,
    });
    page.win.navigation = new EventTarget();
    const child = await page.root.shadowRoot.firstElementChild;
    expect(child.tagName.toLocaleLowerCase()).toEqual('specialist-booking-appointment-list');
  });
});
