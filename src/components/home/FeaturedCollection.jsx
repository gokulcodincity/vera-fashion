import Button from '../Button';
import SmartImage from '../SmartImage';
import Reveal from '../Reveal';
import { buildImageUrl, PHOTOS } from '../../lib/images';

const POINTS = [
  'Natural fibres chosen for Indian weather',
  'Colours designed to layer with each other',
  'Cuts refined across three fittings',
];

/** Editorial split section: image on one side, brand story on the other. */
export default function FeaturedCollection() {
  return (
    <section className="shell py-20 lg:py-28" aria-labelledby="featured-heading">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <SmartImage
            src={buildImageUrl(PHOTOS.featuredWide, { w: 1200, h: 1400, crop: 'entropy' })}
            alt="Neutral wardrobe of everyday essentials hanging on a rail"
            ratio="aspect-[4/5] lg:aspect-[5/6]"
            sizes="(min-width: 1024px) 48vw, 100vw"
          />
        </Reveal>

        <Reveal delay={120} className="lg:pl-4">
          <p className="eyebrow">The Edit</p>
          <h2 id="featured-heading" className="mt-4 text-[2.3rem] leading-[1.05] sm:text-[3rem] lg:text-[3.4rem]">
            Everyday Essentials
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-slate">
            Timeless pieces designed to move with you. A small, deliberate wardrobe of shirts, tees,
            denim and knitwear that we remake every season rather than reinvent.
          </p>

          <ul className="mt-8 space-y-3.5">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm text-slate">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-clay" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>

          <Button to="/shop?category=T-Shirts" className="mt-9" size="lg">
            Explore Collection
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
