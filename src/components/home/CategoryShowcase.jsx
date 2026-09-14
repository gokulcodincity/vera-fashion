import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import SectionHeading from '../SectionHeading';
import SmartImage from '../SmartImage';
import Reveal from '../Reveal';
import { buildImageUrl, PHOTOS } from '../../lib/images';

const CATEGORY_CARDS = [
  {
    label: 'Women',
    caption: 'Dresses, ethnic wear and outerwear',
    to: '/shop?gender=Women',
    photo: PHOTOS.categoryWomen,
    alt: 'Woman in a blush longline coat walking through an arcade',
  },
  {
    label: 'Men',
    caption: 'Shirts, denim and tailoring',
    to: '/shop?gender=Men',
    photo: PHOTOS.categoryMen,
    alt: 'Man in a white linen blend shirt on a city street',
  },
  {
    label: 'New Arrivals',
    caption: 'Fresh off the studio rail',
    to: '/shop?tag=new',
    photo: PHOTOS.categoryNew,
    alt: 'Rail of newly arrived garments in a boutique',
  },
  {
    label: 'Accessories',
    caption: 'Bags, belts and footwear',
    to: '/shop?category=Accessories',
    photo: PHOTOS.categoryAccessories,
    alt: 'Flat lay of a leather handbag, sunglasses and watches',
  },
];

export default function CategoryShowcase() {
  return (
    <section className="shell py-20 lg:py-28" aria-labelledby="category-heading">
      <SectionHeading
        eyebrow="Browse"
        title="Shop by Category"
        titleId="category-heading"
        subtitle="Four ways into the collection, each edited down to the pieces worth owning."
        linkTo="/shop"
        linkLabel="View everything"
      />

      <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {CATEGORY_CARDS.map((card, index) => (
          <Reveal key={card.label} delay={index * 90}>
            <Link
              to={card.to}
              className="group relative block overflow-hidden bg-ink"
              aria-label={`Shop ${card.label}`}
            >
              <SmartImage
                src={buildImageUrl(card.photo, { w: 800, h: 1060 })}
                alt={card.alt}
                ratio="aspect-[3/4] lg:aspect-[4/5]"
                sizes="(min-width: 1024px) 24vw, 46vw"
                className="transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
              />

              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent transition-opacity duration-500 group-hover:from-ink/85" />

              <span className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <span className="block font-display text-xl text-cream sm:text-2xl">
                  {card.label}
                </span>
                <span className="mt-1 hidden text-xs leading-relaxed text-cream/65 sm:block">
                  {card.caption}
                </span>
                <span className="mt-3 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-cream">
                  Explore
                  <ArrowRight
                    size={13}
                    strokeWidth={1.5}
                    className="transition-transform duration-300 group-hover:translate-x-1.5"
                  />
                </span>
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
