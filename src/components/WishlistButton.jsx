import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { cx } from '../utils/format';

/**
 * Wishlist toggle. Two visual treatments:
 *  - "floating" sits on top of a product image
 *  - "inline" sits beside a call to action on the product page
 */
export default function WishlistButton({
  product,
  variant = 'floating',
  className,
  showLabel = false,
}) {
  const { isWishlisted, toggle } = useWishlist();
  const { toast } = useToast();
  const [pulse, setPulse] = useState(false);

  if (!product) return null;
  const active = isWishlisted(product.id);

  const handleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const added = toggle(product.id);
    setPulse(true);
    window.setTimeout(() => setPulse(false), 420);
    toast(added ? 'Added to wishlist' : 'Removed from wishlist', {
      tone: added ? 'wishlist' : 'info',
      description: product.name,
    });
  };

  const shared = 'inline-flex items-center justify-center transition-all duration-300';

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={active}
        aria-label={active ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        className={cx(
          shared,
          'gap-2.5 border border-ink/25 px-6 py-3.5 text-[11px] uppercase tracking-[0.22em] hover:border-ink',
          active ? 'text-clay' : 'text-ink',
          className
        )}
      >
        <Heart
          size={16}
          strokeWidth={1.4}
          className={cx(active && 'fill-clay text-clay', pulse && 'animate-pop')}
        />
        {showLabel && <span>{active ? 'Wishlisted' : 'Wishlist'}</span>}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      aria-label={active ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
      className={cx(
        shared,
        'h-9 w-9 border border-ink/10 bg-cream/90 text-ink backdrop-blur-sm hover:bg-cream',
        className
      )}
    >
      <Heart
        size={15}
        strokeWidth={1.4}
        className={cx(active ? 'fill-clay text-clay' : 'text-ink', pulse && 'animate-pop')}
      />
    </button>
  );
}
