/**
 * ------------------------------------------------------------------
 * STORE CONFIGURATION
 * ------------------------------------------------------------------
 * Everything a shop owner would want to change lives in this file.
 * Swap these values for a real client and the whole site updates:
 * brand name, contact details, WhatsApp number, address, socials,
 * shipping rules and homepage announcement.
 *
 * NOTE: "V\u00C9RA" is written with a unicode escape so the accented
 * character renders identically no matter how the file is encoded.
 */

export const store = {
  /* --- Brand ---------------------------------------------------- */
  storeName: 'V\u00C9RA',
  storeNamePlain: 'VERA',
  tagline: 'Style That Speaks.',
  shortDescription: 'Curated fashion for every version of you.',
  established: '2016',

  /* --- Contact -------------------------------------------------- */
  phone: '+91 98765 43210',
  phoneDial: '+919876543210',
  whatsapp: '919876543210', // country code + number, digits only
  whatsappMessage: 'Hi V\u00C9RA, I would like to know more about your collection.',
  email: 'hello@verafashion.in',
  supportEmail: 'care@verafashion.in',

  /* --- Address -------------------------------------------------- */
  address: {
    line1: '24 Anna Salai, Ground Floor',
    line2: 'Thousand Lights',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600002',
    country: 'India',
  },
  mapsUrl: 'https://maps.google.com/?q=Anna+Salai+Chennai',

  /* --- Hours ---------------------------------------------------- */
  openingHours: [
    { days: 'Monday - Friday', hours: '10:30 AM - 9:00 PM' },
    { days: 'Saturday', hours: '10:00 AM - 9:30 PM' },
    { days: 'Sunday', hours: '11:00 AM - 8:00 PM' },
  ],

  /* --- Social --------------------------------------------------- */
  instagram: 'https://instagram.com/verafashion',
  instagramHandle: '@verafashion',
  facebook: 'https://facebook.com/verafashion',
  pinterest: 'https://pinterest.com/verafashion',

  /* --- Commerce rules ------------------------------------------- */
  currency: 'INR',
  locale: 'en-IN',
  freeShippingThreshold: 1999,
  deliveryFee: 99,
  codFee: 49,
  returnWindowDays: 15,

  /* --- Marketing ------------------------------------------------ */
  announcements: [
    'Free shipping on orders above Rs.1,999',
    'Festive edit is live - up to 40% off',
    'Easy 15 day returns on all orders',
  ],
  newsletterOffer: 'Get first access to new collections, exclusive offers and fashion inspiration.',
};

/** Full address as a single readable line. */
export const formattedAddress = [
  store.address.line1,
  store.address.line2,
  `${store.address.city} ${store.address.pincode}`,
  store.address.state,
].join(', ');

/** Deep link that opens WhatsApp with a pre-filled message. */
export const whatsappLink = (message = store.whatsappMessage) =>
  `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(message)}`;

/** Deep link for the phone dialler. */
export const telLink = `tel:${store.phoneDial}`;

/** Deep link for the mail client. */
export const mailtoLink = `mailto:${store.email}`;

export default store;
