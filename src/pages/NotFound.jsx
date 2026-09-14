import PageMeta from '../components/PageMeta';
import Button from '../components/Button';
import ProductGrid from '../components/ProductGrid';
import SectionHeading from '../components/SectionHeading';
import { bestSellers } from '../data/products';

export default function NotFound() {
  return (
    <>
      <PageMeta
        title="Page not found"
        description="The page you were looking for is no longer here. Browse the VERA collection instead."
      />

      <div className="shell py-24 text-center lg:py-32">
        <p className="eyebrow">Error 404</p>
        <h1 className="mx-auto mt-6 max-w-2xl text-[2.6rem] leading-[1.02] sm:text-[3.6rem]">
          This page has left the rail.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-slate">
          The link you followed is no longer available. The collection, however, is very much still
          here.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Button to="/">Back to home</Button>
          <Button to="/shop" variant="outline">
            Browse the shop
          </Button>
        </div>
      </div>

      <section className="shell pb-24">
        <SectionHeading
          eyebrow="While you are here"
          title="Best Sellers"
          align="center"
          className="mb-12"
        />
        <ProductGrid products={bestSellers.slice(0, 4)} columns="four" />
      </section>
    </>
  );
}
