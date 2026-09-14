import { ArrowUpRight } from 'lucide-react';
import Reveal from '../Reveal';
import { InstagramIcon } from '../icons/SocialIcons';
import { buildImageUrl, PHOTOS } from '../../lib/images';
import { store } from '../../config/store';

const CAPTIONS = [
  'Sunlit accessories from the summer edit',
  'Pastel knitwear on the studio rail',
  'The printed dress rail in our Chennai store',
  'Neutral layering for transitional weather',
  'Colour blocking with our shirting range',
  'Streetwear styling from the weekend drop',
];

export default function InstagramGrid() {
  return (
    <section className="border-t border-line bg-sand/40" aria-labelledby="social-heading">
      <div className="shell py-20 lg:py-24">
        <div className="text-center">
          <p className="eyebrow">Follow along</p>
          <h2 id="social-heading" className="mt-4 text-[2rem] sm:text-[2.6rem]">
            Follow {store.instagramHandle}
          </h2>
          <a
            href={store.instagram}
            target="_blank"
            rel="noreferrer noopener"
            className="group mt-5 inline-flex items-center gap-2.5 text-[11px] uppercase tracking-[0.2em] text-ink transition-colors hover:text-clay"
          >
            <InstagramIcon size={16} />
            <span className="link-underline">Tag us to be featured</span>
            <ArrowUpRight
              size={13}
              strokeWidth={1.5}
              className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </a>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {PHOTOS.social.map((photo, index) => (
            <Reveal key={photo} delay={index * 60}>
              <a
                href={store.instagram}
                target="_blank"
                rel="noreferrer noopener"
                className="group relative block overflow-hidden bg-shell"
                aria-label={`${CAPTIONS[index]} - open Instagram`}
              >
                <img
                  src={buildImageUrl(photo, { w: 520, h: 520, crop: 'entropy' })}
                  alt={CAPTIONS[index]}
                  loading="lazy"
                  decoding="async"
                  className="aspect-square h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08]"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-ink/0 text-cream opacity-0 transition-all duration-300 group-hover:bg-ink/35 group-hover:opacity-100">
                  <InstagramIcon size={22} />
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
