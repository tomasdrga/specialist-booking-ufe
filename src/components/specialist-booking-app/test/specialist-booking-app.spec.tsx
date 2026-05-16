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
    const child = page.root.shadowRoot.querySelector('specialist-booking-appointment-editor');
    expect(child).not.toBeNull();
  });

  it('renders list', async () => {
    const page = await newSpecPage({
      url: `http://localhost/specialist-booking/`,
      components: [SpecialistBookingApp],
      html: `<specialist-booking-app base-path="/specialist-booking/"></specialist-booking-app>`,
    });
    page.win.navigation = new EventTarget();
    const child = page.root.shadowRoot.querySelector('specialist-booking-appointment-list');
    expect(child).not.toBeNull();
  });

  it('renders waitlist', async () => {
    const page = await newSpecPage({
      url: `http://localhost/specialist-booking/waitlist`,
      components: [SpecialistBookingApp],
      html: `<specialist-booking-app base-path="/specialist-booking/"></specialist-booking-app>`,
    });
    page.win.navigation = new EventTarget();
    const child = page.root.shadowRoot.querySelector('specialist-booking-waitlist-panel');
    expect(child).not.toBeNull();
  });
});
