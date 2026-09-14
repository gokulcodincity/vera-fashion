import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Plus, X } from 'lucide-react';
import SmartImage from './SmartImage';
import WishlistButton from './WishlistButton';
import Rating from './Rating';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import { useToast } from '../context/ToastContext';
import { formatPrice, cx } from '../utils/format';

/**
 * Product tile used on the homepage, shop grid, wishlist and related rails.
 * Hovering crossfades to the second gallery frame and reveals Quick Add,
 * which opens an inline size picker so the shopper never leaves the grid.
 */
export default function ProductCard({ product, showRating = false, priority = false, onQuickView }) {
  const { addItem } = useCart();
  const { openCart } = useUI();
  const { toast } = useToast();
  const [picking, setPicking] = useState(false);

  if (!product) return null;

  const hoverImage = product.images[1] || product.images[0];
  const singleSize = !product.sizes || product.sizes.length <= 1;

  const commit = (size) => {
    const color = product.colors?.[0]?.name;
    const variant = product.variants?.find((item) => item.size === size && item.color === color);
    if (product.databaseId && (!variant || !variant.is_active || variant.stock_quantity < 1)) {
      toast('Selected variant is out of stock', { tone: 'info', description: product.name });
      return;
    }
    addItem(product, { size, color, quantity: 1, variantId: variant?.id });
    setPicking(false);
    toast('Added to bag', { description: `${product.name} - Size ${size}` });
    openCart();
  };

  const handleQuickAdd = () => {
    if (singleSize) {
      commit(product.sizes?.[0] || 'One Size');
      return;
    }
    setPicking(true);
  };

  return (
    <article className="group relative flex flex-col">
      <div className="relative overflow-hidden bg-sand">
        <Link
          to={`/product/${product.id}`}
          className="block"
          aria-label={`View ${product.name}`}
          tabIndex={picking ? -1 : 0}
        >
          <SmartImage
            src={product.images[0]}
            alt={`${product.name} in ${product.colors?.[0]?.name || 'signature'} - ${product.category}`}
            ratio="aspect-[3/4]"
            priority={priority}
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 45vw"
            className="transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
          />
          <img
            src={hoverImage}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.isNew && <span className="bg-ink px-2.5 py-1 text-[9px] font-normal uppercase tracking-[0.2em] text-cream">New</span>}
          {product.discount > 0 && <span className="bg-clay px-2.5 py-1 text-[9px] font-normal uppercase tracking-[0.2em] text-cream">{product.discount}% Off</span>}
        </div>

        <WishlistButton product={product} className="absolute right-3 top-3" />

        {onQuickView && !picking && (
          <button
            type="button"
            onClick={() => onQuickView(product)}
            className="absolute inset-x-3 bottom-[3.85rem] hidden items-center justify-center gap-2 border border-ink/10 bg-cream/95 px-3 py-2.5 text-[9px] uppercase tracking-[0.2em] text-ink opacity-0 shadow-soft backdrop-blur-sm transition-all duration-300 hover:bg-white md:flex md:translate-y-2 md:group-hover:translate-y-0 md:group-hover:opacity-100"
          >
            <Eye size={13} strokeWidth={1.5} />Quick view
          </button>
        )}

        <div
          className={cx(
            'absolute inset-x-3 bottom-3 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
            'md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100',
            picking && 'md:translate-y-0 md:opacity-100'
          )}
        >
          {picking ? (
            <div className="border border-ink/10 bg-cream/97 p-2.5 shadow-soft backdrop-blur-sm">
              <div className="mb-2 flex items-center justify-between px-0.5">
                <span className="text-[9px] uppercase tracking-[0.2em] text-muted">Select size</span>
                <button type="button" onClick={() => setPicking(false)} aria-label="Cancel quick add" className="text-muted transition-colors hover:text-ink"><X size={13} strokeWidth={1.6} /></button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {product.sizes.map((size) => (
                  <button key={size} type="button" onClick={() => commit(size)} className="min-w-9 border border-line bg-white px-2 py-1.5 text-[10px] uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink hover:bg-ink hover:text-cream">{size}</button>
                ))}
              </div>
            </div>
          ) : (
            <button type="button" onClick={handleQuickAdd} className="flex w-full items-center justify-center gap-2 bg-ink/92 px-4 py-3 text-[10px] font-normal uppercase tracking-[0.22em] text-cream backdrop-blur-sm transition-colors duration-300 hover:bg-clay"><Plus size={13} strokeWidth={1.6} />Quick Add</button>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted">{product.category}</p>
        <h3 className="mt-1.5 font-sans text-[0.9rem] font-normal leading-snug text-ink"><Link to={`/product/${product.id}`} className="link-underline">{product.name}</Link></h3>
        {showRating && <Rating value={product.rating} className="mt-2" size={12} showValue />}
        <div className="mt-2 flex items-baseline gap-2.5">
          <span className="text-[0.9rem] tabular-nums text-ink">{formatPrice(product.price)}</span>
          {product.originalPrice && <span className="text-xs tabular-nums text-muted line-through">{formatPrice(product.originalPrice)}</span>}
        </div>
      </div>
    </article>
  );
}
