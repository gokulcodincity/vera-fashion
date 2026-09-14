import SectionHeading from '../SectionHeading';
import ProductGrid from '../ProductGrid';
import { bestSellers } from '../../data/products';

export default function BestSellers() {
  const items = bestSellers.slice(0, 4);

  return (
    <section className="shell py-20 lg:py-28" aria-labelledby="best-sellers-heading">
      <SectionHeading
        eyebrow="Most Loved"
        title="Best Sellers"
        titleId="best-sellers-heading"
        subtitle="The pieces our customers keep coming back for."
        linkTo="/shop?tag=bestseller"
        linkLabel="Shop best sellers"
        className="mb-12"
      />
      <ProductGrid products={items} columns="four" showRating />
    </section>
  );
}
