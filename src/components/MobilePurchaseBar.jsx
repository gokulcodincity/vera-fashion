import Button from './Button';
import WishlistButton from './WishlistButton';
import { formatPrice } from '../utils/format';

/** Fixed purchase affordance for small product-page viewports. */
export default function MobilePurchaseBar({ product, onAdd, disabled = false }) {
  if (!product) return null;
  return <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-line bg-cream/95 px-4 pt-3 backdrop-blur-md lg:hidden" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}><div className="mx-auto flex max-w-2xl items-center gap-3"><WishlistButton product={product} className="h-12 w-12 shrink-0 bg-white" /><div className="min-w-0 flex-1"><p className="truncate text-[10px] uppercase tracking-[0.16em] text-muted">{product.name}</p><p className="mt-0.5 text-base tabular-nums text-ink">{formatPrice(product.price)}</p></div><Button onClick={onAdd} size="md" className="shrink-0 px-5" disabled={disabled}>{disabled ? 'Out of Stock' : 'Add to Bag'}</Button></div></div>;
}
