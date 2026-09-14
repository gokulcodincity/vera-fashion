import { store, formattedAddress } from '../config/store';

/**
 * Content for the policy / help pages linked from the footer.
 * Each entry renders through `pages/InfoPage.jsx`, so adding a new
 * policy page is a matter of adding one object here.
 */
export const infoPages = {
  shipping: {
    title: 'Shipping',
    eyebrow: 'Help',
    intro: `We ship across India from our Chennai studio. Orders placed before 2 PM are packed and dispatched the same working day.`,
    sections: [
      {
        heading: 'Delivery timelines',
        body: [
          'Metro cities: 2 to 3 working days.',
          'Rest of India: 4 to 6 working days.',
          'Remote pincodes may add 1 to 2 days. You will see the estimate at checkout.',
        ],
      },
      {
        heading: 'Charges',
        body: [
          `Delivery is free on all orders above Rs.${store.freeShippingThreshold.toLocaleString('en-IN')}.`,
          `A flat fee of Rs.${store.deliveryFee} applies below that value.`,
          `Cash on delivery carries a handling fee of Rs.${store.codFee}.`,
        ],
      },
      {
        heading: 'Tracking',
        body: [
          'A tracking link is sent by email and SMS as soon as your parcel leaves the studio.',
          `If anything looks off, message us on WhatsApp at ${store.phone} and we will chase it for you.`,
        ],
      },
    ],
  },

  returns: {
    title: 'Returns & Exchanges',
    eyebrow: 'Help',
    intro: `Try it on, live in it for a few days, and if it is not right we will make it right. Returns and size exchanges are accepted within ${store.returnWindowDays} days of delivery.`,
    sections: [
      {
        heading: 'How it works',
        body: [
          'Reply to your order email or message us on WhatsApp with your order number.',
          'We arrange a free reverse pickup for serviceable pincodes.',
          'Refunds reach the original payment method within 5 to 7 working days of the parcel reaching us.',
        ],
      },
      {
        heading: 'Conditions',
        body: [
          'Tags intact, unworn, unwashed and in the original packaging.',
          'Innerwear, and pieces marked final sale, cannot be returned for hygiene reasons.',
          'Size exchanges are free once per order.',
        ],
      },
    ],
  },

  'size-guide': {
    title: 'Size Guide',
    eyebrow: 'Help',
    intro:
      'All measurements are body measurements in inches. If you are between two sizes, we recommend the larger one for a relaxed drape.',
    sections: [
      {
        heading: 'Womenswear',
        table: {
          head: ['Size', 'Bust', 'Waist', 'Hip'],
          rows: [
            ['XS', '31', '24', '34'],
            ['S', '33', '26', '36'],
            ['M', '35', '28', '38'],
            ['L', '37.5', '30.5', '40.5'],
            ['XL', '40', '33', '43'],
            ['XXL', '42.5', '35.5', '45.5'],
          ],
        },
      },
      {
        heading: 'Menswear',
        table: {
          head: ['Size', 'Chest', 'Waist', 'Shoulder'],
          rows: [
            ['S', '38', '32', '17'],
            ['M', '40', '34', '17.5'],
            ['L', '42', '36', '18'],
            ['XL', '44', '38', '18.5'],
            ['XXL', '46', '40', '19'],
          ],
        },
      },
      {
        heading: 'Denim and trousers',
        body: [
          'Denim is listed by waist measurement in inches: 28, 30, 32, 34 and 36.',
          'Inseam is 31 inches on regular fits and 30 inches on relaxed fits.',
          'Our in-store team offers free length alterations on all trousers.',
        ],
      },
      {
        heading: 'Still unsure?',
        body: [
          `Send us the garment you already own and love, and we will match it. WhatsApp ${store.phone}.`,
        ],
      },
    ],
  },

  faqs: {
    title: 'Frequently Asked Questions',
    eyebrow: 'Help',
    intro: 'The questions our customers ask most. If yours is not here, we are one message away.',
    sections: [
      {
        heading: 'Is this an online-only brand?',
        body: [
          `No. We have a flagship store at ${formattedAddress}, and everything you see online can be tried on in person.`,
        ],
      },
      {
        heading: 'Do you offer alterations?',
        body: [
          'Yes. Length and waist alterations are complimentary on all full-price purchases made in store.',
        ],
      },
      {
        heading: 'How do I know a piece is in stock?',
        body: [
          'Sizes that are unavailable appear crossed out on the product page. Everything else is ready to ship.',
        ],
      },
      {
        heading: 'Can I order over WhatsApp?',
        body: [
          `Absolutely. Message ${store.phone} with a screenshot of what you like and we will place the order for you.`,
        ],
      },
      {
        heading: 'Do you restock sold out pieces?',
        body: [
          'Core essentials are restocked every three weeks. Seasonal and festive pieces are made in limited runs.',
        ],
      },
    ],
  },

  privacy: {
    title: 'Privacy Policy',
    eyebrow: 'Legal',
    intro:
      'This is a demonstration storefront. The policy below outlines the approach a real VERA store would take with customer data.',
    sections: [
      {
        heading: 'What we collect',
        body: [
          'Contact details you enter at checkout: name, email, phone and delivery address.',
          'Your bag and wishlist, which are stored only in your own browser using local storage.',
        ],
      },
      {
        heading: 'What we never do',
        body: [
          'We do not sell or rent customer data to third parties.',
          'We do not store card details. Payments would be handled by a certified payment gateway.',
        ],
      },
      {
        heading: 'Your choices',
        body: [
          'You can unsubscribe from marketing email at any time from the footer of any newsletter.',
          `To request deletion of your data, write to ${store.email}.`,
        ],
      },
    ],
  },

  terms: {
    title: 'Terms of Service',
    eyebrow: 'Legal',
    intro:
      'These terms describe how orders are placed and fulfilled. This site is a portfolio demonstration and no real transactions are processed.',
    sections: [
      {
        heading: 'Orders',
        body: [
          'An order is confirmed once you receive an order number by email.',
          'We may cancel an order where a pricing or stock error has occurred, with a full refund.',
        ],
      },
      {
        heading: 'Pricing',
        body: [
          'All prices are in Indian Rupees and include applicable GST.',
          'Promotional pricing applies only while a campaign is live and cannot be applied retrospectively.',
        ],
      },
      {
        heading: 'Demo notice',
        body: [
          'Checkout on this site is a user interface demonstration only. No payment is captured and no goods are dispatched.',
        ],
      },
    ],
  },
};

export const infoPageSlugs = Object.keys(infoPages);

export const getInfoPage = (slug) => infoPages[slug];
