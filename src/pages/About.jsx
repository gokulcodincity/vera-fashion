import { Gem, Leaf, Scissors, Sparkles } from 'lucide-react';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import SmartImage from '../components/SmartImage';
import Button from '../components/Button';
import Reveal from '../components/Reveal';
import SectionHeading from '../components/SectionHeading';
import { buildImageUrl, PHOTOS } from '../lib/images';
import { store, formattedAddress } from '../config/store';

const PILLARS = [
  {
    Icon: Scissors,
    title: 'Made in small runs',
    body: 'Every style is produced in limited batches with partner units in Tamil Nadu and Punjab, so we can watch the quality of each piece.',
  },
  {
    Icon: Gem,
    title: 'Fabric first',
    body: 'We start with the cloth. Cotton, linen, silk and wool blends chosen for how they behave in Indian heat and humidity.',
  },
  {
    Icon: Leaf,
    title: 'Less, but better',
    body: 'No weekly drops. Two considered collections a year, plus a small core range we remake and refine rather than replace.',
  },
  {
    Icon: Sparkles,
    title: 'Finished by hand',
    body: 'Embroidery, hemming and final pressing are done by hand at our Chennai studio before anything is packed.',
  },
];

export default function About() {
  return (
    <>
      <PageMeta
        title="Our Story"
        description={`${store.storeNamePlain} is an independent fashion label founded in ${store.established}, designing considered clothing in small runs from Chennai.`}
      />

      <div className="shell pt-8">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'About' }]} />
      </div>

      {/* Intro */}
      <section className="shell pb-16 pt-7 lg:pb-24">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16">
          <div>
            <p className="eyebrow">Our story</p>
            <h1 className="mt-5 text-[2.6rem] leading-[1.02] sm:text-[3.6rem] lg:text-[4.2rem]">
              Clothing built to be kept.
            </h1>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-slate">
              {store.storeName} began in {store.established} with a single rail in a small Chennai
              shopfront and one stubborn idea: that well-made clothes should not be a luxury reserved
              for a handful of labels.
            </p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate">
              A decade later we still work the same way. We choose the cloth first, cut a sample,
              wear it for a month, and only then decide whether it deserves to carry our name. What
              you see online is what hangs in our store, photographed as it is.
            </p>
            <Button to="/shop" className="mt-9" size="lg">
              Shop the collection
            </Button>
          </div>

          <Reveal>
            <SmartImage
              src={buildImageUrl(PHOTOS.storefront, { w: 1100, h: 1200, crop: 'entropy' })}
              alt="The VERA boutique window with coats on display"
              ratio="aspect-[4/5] lg:aspect-square"
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
            />
          </Reveal>
        </div>
      </section>

      {/* Mission */}
      <section className="border-y border-line bg-sand/50">
        <div className="shell py-16 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16">
            <Reveal className="order-2 lg:order-1">
              <SmartImage
                src={buildImageUrl(PHOTOS.atelier, { w: 1100, h: 800, crop: 'entropy' })}
                alt="Garments on a rail inside the VERA studio"
                ratio="aspect-[4/3]"
                sizes="(min-width: 1024px) 45vw, 100vw"
              />
            </Reveal>

            <div className="order-1 lg:order-2">
              <p className="eyebrow">Our mission</p>
              <h2 className="mt-4 text-[2.1rem] leading-[1.08] sm:text-[2.8rem]">
                To make the honest version of premium.
              </h2>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate">
                Premium usually means a bigger margin rather than a better garment. We would rather
                spend the money on the fabric, the stitch count and the finishing, and keep the price
                somewhere a working professional can actually justify.
              </p>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate">
                That means no inflated list prices, no permanent sale, and no photography that
                flatters a garment into something it is not.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="shell py-20 lg:py-28">
        <SectionHeading
          eyebrow="How we work"
          title="Quality, in practice"
          subtitle="Four commitments that decide what we make and what we leave on the cutting table."
        />

        <div className="mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-2">
          {PILLARS.map(({ Icon, title, body }, index) => (
            <Reveal key={title} delay={index * 80} className="border-t border-line pt-7">
              <span className="inline-flex text-clay">
                <Icon size={22} strokeWidth={1.1} />
              </span>
              <h3 className="mt-4 font-display text-2xl text-ink">{title}</h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-slate">{body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Philosophy quote */}
      <section className="bg-ink">
        <div className="shell py-20 text-center lg:py-28">
          <p className="text-[10px] uppercase tracking-[0.28em] text-cream/45">
            Fashion philosophy
          </p>
          <blockquote className="mx-auto mt-7 max-w-3xl font-display text-[1.8rem] leading-[1.25] text-cream sm:text-[2.6rem]">
            Style is not the loudest thing in the room. It is the piece you reach for on the mornings
            that matter, five years after you bought it.
          </blockquote>
          <p className="mt-8 text-[10px] uppercase tracking-[0.22em] text-cream/50">
            {store.storeName} Design Studio, {store.address.city}
          </p>
        </div>
      </section>

      {/* Store */}
      <section className="shell py-20 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <Reveal>
            <SmartImage
              src={buildImageUrl(PHOTOS.studio, { w: 1100, h: 820, crop: 'entropy' })}
              alt="Interior shelving inside the VERA flagship store"
              ratio="aspect-[4/3]"
              sizes="(min-width: 1024px) 48vw, 100vw"
            />
          </Reveal>

          <div>
            <p className="eyebrow">Visit us</p>
            <h2 className="mt-4 text-[2.1rem] leading-[1.08] sm:text-[2.6rem]">
              Come and feel the fabric.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-slate">
              Our flagship store carries the full collection along with in-house alterations. Walk in
              with a garment you already love and our team will match the fit.
            </p>

            <address className="mt-7 not-italic text-sm leading-relaxed text-slate">
              {formattedAddress}
            </address>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button to="/contact">Contact us</Button>
              <Button
                href={store.mapsUrl}
                target="_blank"
                rel="noreferrer noopener"
                variant="outline"
              >
                Get directions
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
