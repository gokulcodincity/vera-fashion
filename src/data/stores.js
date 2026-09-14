import { store } from '../config/store';

/**
 * Physical stores shown on the contact page / store locator.
 * The first entry mirrors the flagship details in `config/store.js`.
 */
export const storeLocations = [
  {
    name: `${store.storeName} Flagship`,
    city: store.address.city,
    address: `${store.address.line1}, ${store.address.line2}, ${store.address.city} ${store.address.pincode}`,
    phone: store.phone,
    hours: 'Mon - Sat: 10:30 AM - 9:00 PM',
    mapsUrl: store.mapsUrl,
    isFlagship: true,
  },
  {
    name: `${store.storeName} Bengaluru`,
    city: 'Bengaluru',
    address: '18 Lavelle Road, Ashok Nagar, Bengaluru 560001',
    phone: '+91 98765 43211',
    hours: 'Mon - Sun: 11:00 AM - 9:00 PM',
    mapsUrl: 'https://maps.google.com/?q=Lavelle+Road+Bengaluru',
    isFlagship: false,
  },
  {
    name: `${store.storeName} Coimbatore`,
    city: 'Coimbatore',
    address: '7 Race Course Road, Coimbatore 641018',
    phone: '+91 98765 43212',
    hours: 'Mon - Sat: 10:30 AM - 8:30 PM',
    mapsUrl: 'https://maps.google.com/?q=Race+Course+Road+Coimbatore',
    isFlagship: false,
  },
];

export default storeLocations;
