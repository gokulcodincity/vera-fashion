/**
 * Image helpers.
 *
 * All photography is served from the Unsplash image CDN using stable photo
 * ids, sized and cropped on the fly. Every id in `PHOTOS` has been verified
 * to resolve, so the demo never shows a broken image. Replace the ids (or
 * point `buildImageUrl` at your own CDN) when working with a real client.
 */

const CDN = 'https://images.unsplash.com/';

/**
 * Build a responsive, cropped image URL.
 *
 * @param {string} id     Unsplash photo id, e.g. "photo-1539109136881-3be0616acf4b"
 * @param {object} [opts]
 * @param {number} [opts.w] target width in px
 * @param {number} [opts.h] target height in px
 * @param {string} [opts.crop] imgix crop strategy
 * @param {number} [opts.q] jpeg quality
 */
export function buildImageUrl(id, { w = 900, h, crop = 'faces,entropy', q = 78 } = {}) {
  if (!id) return '';
  const params = new URLSearchParams({
    auto: 'format,compress',
    fit: 'crop',
    crop,
    q: String(q),
    w: String(w),
  });
  if (h) params.set('h', String(h));
  return `${CDN}${id}?${params.toString()}`;
}

/**
 * Product gallery. A single garment photograph is framed three different
 * ways (full look, detail, alternate framing) which is exactly how premium
 * fashion stores present a product. When a genuine second photograph of the
 * same garment family exists it is passed as `secondary`.
 */
export function galleryFor(primary, secondary) {
  const frames = [
    buildImageUrl(primary, { w: 1100, h: 1400, crop: 'faces,entropy' }),
    buildImageUrl(primary, { w: 1100, h: 1400, crop: 'entropy' }),
  ];
  if (secondary) {
    frames.splice(1, 0, buildImageUrl(secondary, { w: 1100, h: 1400, crop: 'entropy' }));
    frames.push(buildImageUrl(secondary, { w: 1100, h: 1400, crop: 'top' }));
  } else {
    frames.push(buildImageUrl(primary, { w: 1100, h: 1400, crop: 'top' }));
  }
  return frames;
}

/** Editorial photography used across the marketing sections. */
export const PHOTOS = {
  heroPortrait: 'photo-1539109136881-3be0616acf4b',
  heroInset: 'photo-1485462537746-965f33f7f6a7',
  promoWide: 'photo-1483985988355-763728e1935b',
  featuredWide: 'photo-1512436991641-6745cdb1723f',
  categoryWomen: 'photo-1485462537746-965f33f7f6a7',
  categoryMen: 'photo-1621072156002-e2fccdc0b176',
  categoryNew: 'photo-1578932750294-f5075e85f44a',
  categoryAccessories: 'photo-1492707892479-7bc8d5a4ee93',
  storefront: 'photo-1445205170230-053b83016050',
  atelier: 'photo-1441984904996-e0b6ba687e04',
  studio: 'photo-1441986300917-64674bd600d8',
  rail: 'photo-1490481651871-ab68de25d43d',
  social: [
    'photo-1469334031218-e382a71b716b',
    'photo-1509319117193-57bab727e09d',
    'photo-1567401893414-76b7b1e5a7a5',
    'photo-1495121605193-b116b5b9c5fe',
    'photo-1489987707025-afc232f7ea0f',
    'photo-1600950207944-0d63e8edbc3f',
  ],
};

/** 1x1 transparent pixel used while an image is still loading. */
export const BLANK_PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
