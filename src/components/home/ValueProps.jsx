import { Gem, Scissors, ShoppingBag, Truck } from 'lucide-react';
import Reveal from '../Reveal';
import { store } from '../../config/store';

const VALUES = [
  {
    Icon: Gem,
    title: 'Premium Quality',
    body: 'Mill-sourced fabrics, reinforced seams and a three-stage quality check before anything ships.',
  },
  {
    Icon: Scissors,
    title: 'Curated Styles',
    body: 'Small, considered collections. We would rather stock fifty pieces properly than five hundred badly.',
  },
  {
    Icon: ShoppingBag,
    title: 'Easy Shopping',
    body: `Straightforward sizing, honest photography and ${store.returnWindowDays} day returns with free pickup.`,
  },
  {
    Icon: Truck,
    title: 'Fast Delivery',
    body: 'Dispatched the same working day, with free delivery across India on larger orders.',
  },
];

export default function ValueProps() {
  return (
    <section className="border-y border-line bg-sand/50" aria-labelledby="values-heading">
      <div className="shell py-16 lg:py-20">
        <h2 id="values-heading" className="sr-only">
          Why shop with {store.storeNamePlain}
        </h2>
        <p className="eyebrow mb-10 text-center">Why {store.storeName}</p>

        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(({ Icon, title, body }, index) => (
            <Reveal key={title} delay={index * 80} className="text-center sm:text-left">
              <span className="inline-flex text-clay">
                <Icon size={24} strokeWidth={1.1} />
              </span>
              <h3 className="mt-4 font-sans text-[11px] font-normal uppercase tracking-[0.2em] text-ink">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate">{body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
