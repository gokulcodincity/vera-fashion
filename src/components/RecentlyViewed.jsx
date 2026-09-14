import { useEffect, useMemo } from 'react';
import { getProductById } from '../data/products';
import useLocalStorage from '../hooks/useLocalStorage';
import ProductGrid from './ProductGrid';
import SectionHeading from './SectionHeading';

const STORAGE_KEY = 'vera:recently-viewed:v1';
const MAX_ITEMS = 8;

/** Stores only catalogue IDs so history is compact and never becomes stale product data. */
export default function RecentlyViewed({ product }) {
  const [recentIds, setRecentIds] = useLocalStorage(STORAGE_KEY, []);

  useEffect(() => {
    if (!product?.id) return;
    setRecentIds((current) => [
      product.id,
      ...(Array.isArray(current) ? current.filter((id) => id !== product.id) : []),
    ].slice(0, MAX_ITEMS));
  }, [product?.id, setRecentIds]);

  const recentProducts = useMemo(
    () => (Array.isArray(recentIds) ? recentIds : [])
      .filter((id) => id !== product?.id)
      .map(getProductById)
      .filter(Boolean)
      .slice(0, 4),
    [product?.id, recentIds]
  );

  if (recentProducts.length === 0) return null;

  return (
    <section className="shell py-16 lg:py-24">
      <SectionHeading eyebrow="Your edit" title="Recently Viewed" titleId="recently-viewed-heading" className="mb-12" />
      <ProductGrid products={recentProducts} columns="four" />
    </section>
  );
}
