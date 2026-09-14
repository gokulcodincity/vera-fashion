import ProductCard from './ProductCard';
import Reveal from './Reveal';
import { cx } from '../utils/format';

const COLUMN_PRESETS = {
  four: 'grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4 xl:gap-x-7',
  three: 'grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6',
  scrollRail: '',
};

/** Skeleton tile shown while a grid is loading. */
function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[3/4] w-full bg-sand" />
      <div className="mt-4 h-2.5 w-1/3 bg-sand" />
      <div className="mt-2.5 h-3 w-4/5 bg-sand" />
      <div className="mt-2.5 h-3 w-1/4 bg-sand" />
    </div>
  );
}

export default function ProductGrid({
  products = [],
  columns = 'four',
  loading = false,
  skeletonCount = 8,
  showRating = false,
  animate = true,
  prioritiseFirst = 0,
  className,
  onQuickView,
}) {
  const gridClass = cx('grid', COLUMN_PRESETS[columns] || COLUMN_PRESETS.four, className);

  if (loading) {
    return <div className={gridClass}>{Array.from({ length: skeletonCount }, (_, index) => <SkeletonCard key={index} />)}</div>;
  }

  const renderCard = (product, index) => (
    <ProductCard
      product={product}
      showRating={showRating}
      priority={index < prioritiseFirst}
      onQuickView={onQuickView}
    />
  );

  return (
    <div className={gridClass}>
      {products.map((product, index) =>
        animate ? <Reveal key={product.id} delay={Math.min(index, 5) * 70} as="div">{renderCard(product, index)}</Reveal> : <ProductCard key={product.id} product={product} showRating={showRating} priority={index < prioritiseFirst} onQuickView={onQuickView} />
      )}
    </div>
  );
}
