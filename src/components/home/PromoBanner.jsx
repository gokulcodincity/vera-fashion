import Button from '../Button';
import Reveal from '../Reveal';
import { buildImageUrl, PHOTOS } from '../../lib/images';

/** Seasonal sale banner. Full-bleed photography with a dark scrim for contrast. */
export default function PromoBanner() {
  return (
    <section aria-labelledby="promo-heading" className="relative overflow-hidden bg-ink">
      <img
        src={buildImageUrl(PHOTOS.promoWide, { w: 1900, h: 900, crop: 'entropy' })}
        alt="Shopper carrying VERA bags along a city street during the seasonal sale"
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-center opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/65 to-ink/25" />

      <div className="shell relative py-24 lg:py-36">
        <Reveal className="max-w-lg">
          <p className="text-[10px] uppercase tracking-[0.28em] text-cream/60">
            Season Sale
          </p>
          <h2
            id="promo-heading"
            className="mt-5 text-[2.8rem] leading-[0.95] text-cream sm:text-[4rem] lg:text-[4.8rem]"
          >
            Up to 40% Off
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream/70 sm:text-base">
            Seasonal styles made for you. Selected dresses, shirts, denim and outerwear reduced while
            stock lasts.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button to="/shop?tag=sale" variant="light" size="lg">
              Shop Sale
            </Button>
            <Button to="/shop" variant="ghostLight" size="lg">
              Full Collection
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
