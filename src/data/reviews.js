/**
 * Demo customer reviews. A shared pool is mapped deterministically onto each
 * product so every product page shows consistent, realistic feedback without
 * hand-writing hundreds of entries. All names are fictional.
 */

const POOL = [
  {
    name: 'Aditi Raghavan',
    rating: 5,
    date: '12 August 2026',
    title: 'Better than expected',
    body: 'The fabric feels genuinely premium and the stitching is clean throughout. I sized as recommended and the fit was spot on.',
  },
  {
    name: 'Karthik Menon',
    rating: 5,
    date: '4 August 2026',
    title: 'Worth every rupee',
    body: 'I was unsure about ordering online but the finish is closer to a boutique piece than anything I have bought at this price.',
  },
  {
    name: 'Sneha Kulkarni',
    rating: 4,
    date: '29 July 2026',
    title: 'Lovely piece, runs slightly large',
    body: 'Beautiful colour in daylight and very comfortable. I would suggest going one size down if you prefer a closer fit.',
  },
  {
    name: 'Rohan Deshpande',
    rating: 5,
    date: '21 July 2026',
    title: 'Holds up after washing',
    body: 'Third wash and there is no fading or shrinking. The colour is exactly as photographed, which is rare.',
  },
  {
    name: 'Meera Iyer',
    rating: 5,
    date: '15 July 2026',
    title: 'Got compliments all evening',
    body: 'Wore it to a family function and three people asked where it was from. Packaging was lovely too.',
  },
  {
    name: 'Farhan Qureshi',
    rating: 4,
    date: '8 July 2026',
    title: 'Great quality, quick delivery',
    body: 'Arrived in three days in Chennai. Material is breathable which matters here. Only wish there were more colours.',
  },
  {
    name: 'Divya Nair',
    rating: 5,
    date: '30 June 2026',
    title: 'Exactly as described',
    body: 'The product page measurements were accurate, so there was no guesswork. Will be ordering the other colour.',
  },
  {
    name: 'Aryan Kapoor',
    rating: 4,
    date: '22 June 2026',
    title: 'Comfortable for long days',
    body: 'Wore it through a twelve hour work day with no discomfort. Feels well constructed rather than mass produced.',
  },
  {
    name: 'Ishita Bansal',
    rating: 5,
    date: '14 June 2026',
    title: 'My third order from VERA',
    body: 'Consistent quality every single time. The team also helped me exchange a size over WhatsApp within a day.',
  },
];

/** Simple stable hash so the same product always gets the same reviews. */
function hash(value) {
  let total = 0;
  for (let i = 0; i < value.length; i += 1) total += value.charCodeAt(i);
  return total;
}

export function reviewsFor(product, count = 3) {
  if (!product) return [];
  const start = hash(product.id) % POOL.length;
  return Array.from({ length: count }, (_, i) => POOL[(start + i * 2) % POOL.length]);
}

/** Homepage testimonials. */
export const testimonials = [
  {
    name: 'Ananya Sharma',
    location: 'Bengaluru',
    rating: 5,
    quote:
      'Absolutely loved the quality and fit. The collection feels premium without being overpriced, and the pieces work together effortlessly.',
  },
  {
    name: 'Vikram Shetty',
    location: 'Mumbai',
    rating: 5,
    quote:
      'I ordered two shirts and a blazer. The tailoring is sharp, the fabric breathes, and everything arrived pressed and beautifully packed.',
  },
  {
    name: 'Priyanka Reddy',
    location: 'Hyderabad',
    rating: 5,
    quote:
      'The saree I bought for my sister was stunning in person. Their team answered every question on WhatsApp before I ordered.',
  },
  {
    name: 'Nikhil Joshi',
    location: 'Pune',
    rating: 4,
    quote:
      'Clean, quiet design and no gimmicks. Delivery was quick and the return policy gave me the confidence to try a new size.',
  },
];
