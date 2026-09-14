import Button from '../Button';
import SmartImage from '../SmartImage';
import { buildImageUrl, PHOTOS } from '../../lib/images';
import { store } from '../../config/store';

/**
 * Editorial split hero. Text sits on cream, photography carries the season.
 * On mobile the imagery stacks above the copy so nothing gets cropped badly.
 */
export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line" aria-labelledby="hero-heading">
      <div className="shell">
        <div className="grid items-center gap-10 py-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:py-20">
          {/* Copy */}
          <div className="order-2 max-w-xl lg:order-1">
            <p className="eyebrow animate-fade-up">Autumn Collection {new Date().getFullYear()}</p>

            <h1
              id="hero-heading"
              className="mt-5 animate-fade-up text-[3.1rem] leading-[0.98] sm:text-[4.2rem] lg:text-[5.2rem] xl:text-[5.8rem]"
              style={{ animationDelay: '80ms' }}
            >
              {store.tagline}
            </h1>

            <p
              className="mt-6 max-w-md animate-fade-up text-base leading-relaxed text-slate"
              style={{ animationDelay: '160ms' }}
            >
              {store.shortDescription} Considered cuts, natural fabrics and a palette that works
              together season after season.
            </p>

            <div
              className="mt-9 flex animate-fade-up flex-wrap items-center gap-3"
              style={{ animationDelay: '240ms' }}
            >
              <Button to="/shop?gender=Women" size="lg">
                Shop Women
              </Button>
              <Button to="/shop?gender=Men" variant="outline" size="lg">
                Shop Men
              </Button>
            </div>

            <dl
              className="mt-12 grid max-w-md animate-fade-up grid-cols-3 gap-6 border-t border-line pt-7"
              style={{ animationDelay: '320ms' }}
            >
              {[
                { value: '120+', label: 'Styles in store' },
                { value: '4.8', label: 'Average rating' },
                { value: '15 day', label: 'Easy returns' },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="font-display text-2xl text-ink sm:text-3xl">{stat.value}</dt>
                  <dd className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted">
                    {stat.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Imagery */}
          <div className="relative order-1 lg:order-2">
            <div className="animate-fade-in">
              <SmartImage
                src={buildImageUrl(PHOTOS.heroPortrait, { w: 1200, h: 1500 })}
                alt="Model wearing a powder blue longline trench coat from the VERA autumn collection"
                ratio="aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5]"
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </div>

            {/* Overlapping inset - desktop only */}
            <div
              className="absolute -bottom-8 -left-8 hidden w-44 animate-fade-up border-4 border-cream xl:block"
              style={{ animationDelay: '380ms' }}
            >
              <SmartImage
                src={buildImageUrl(PHOTOS.heroInset, { w: 500, h: 640 })}
                alt="Blush longline coat styled with black trousers"
                ratio="aspect-[4/5]"
                sizes="176px"
              />
            </div>

            {/* Floating caption card */}
            <div
              className="absolute right-4 top-4 animate-fade-up bg-cream/95 px-4 py-3 backdrop-blur-sm sm:right-6 sm:top-6"
              style={{ animationDelay: '440ms' }}
            >
              <p className="text-[9px] uppercase tracking-[0.22em] text-muted">The Outerwear Edit</p>
              <p className="mt-1 font-display text-lg leading-none text-ink">Now in store</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
