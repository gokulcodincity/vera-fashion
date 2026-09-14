import SectionHeading from '../SectionHeading';
import ProductGrid from '../ProductGrid';
import { newArrivals } from '../../data/products';

export default function NewArrivals() {
  const items = newArrivals.slice(0, 8);

  return (
    <section className="shell pb-20 lg:pb-28" aria-labelledby="new-arrivals-heading">
      <SectionHeading
        eyebrow="Just In"
        title="New Arrivals"
        titleId="new-arrivals-heading"
        subtitle="Fresh styles, just for you."
        linkTo="/shop?tag=new"
        linkLabel="See all new"
        className="mb-12"
      />
      <ProductGrid products={items} columns="four" />
    </section>
  );
}
