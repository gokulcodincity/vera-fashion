import { Link } from 'react-router-dom';
import { ShoppingBag, Trash } from 'lucide-react';
import Drawer from './Drawer';
import Button from './Button';
import QuantitySelector from './QuantitySelector';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import { useToast } from '../context/ToastContext';
import { formatPrice, pluralise } from '../utils/format';
import { store } from '../config/store';

/** Slide-in bag summary opened from the navbar and after every add to bag. */
export default function CartDrawer() {
  const { isCartOpen, closeCart } = useUI();
  const {
    items,
    totalItems,
    subtotal,
    savings,
    delivery,
    total,
    increment,
    decrement,
    removeItem,
    qualifiesForFreeShipping,
    amountToFreeShipping,
    isEmpty,
  } = useCart();
  const { toast } = useToast();

  const progress = Math.min(100, Math.round((subtotal / store.freeShippingThreshold) * 100));

  return (
    <Drawer
      open={isCartOpen}
      onClose={closeCart}
      title={isEmpty ? 'Your bag' : `Your bag (${pluralise(totalItems, 'item')})`}
      footer={
        !isEmpty && (
          <div className="space-y-4 px-5 py-5 sm:px-6">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate">Subtotal</dt>
                <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
              </div>
              {savings > 0 && (
                <div className="flex justify-between text-clay">
                  <dt>You save</dt>
                  <dd className="tabular-nums">-{formatPrice(savings)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-slate">Delivery</dt>
                <dd className="tabular-nums">
                  {delivery === 0 ? 'Free' : formatPrice(delivery)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatPrice(total)}</dd>
              </div>
            </dl>

            <div className="grid gap-2.5">
              <Button to="/checkout" onClick={closeCart} full>
                Proceed to checkout
              </Button>
              <Button to="/cart" onClick={closeCart} variant="outline" full>
                View bag
              </Button>
            </div>
          </div>
        )
      }
    >
      {isEmpty ? (
        <div className="flex h-full flex-col items-center justify-center px-8 text-center">
          <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-line bg-sand">
            <ShoppingBag size={22} strokeWidth={1.2} className="text-ink/70" />
          </span>
          <h3 className="text-2xl">Your bag is waiting.</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate">
            Nothing here yet. Explore the new season and find something you will keep for years.
          </p>
          <Button to="/shop" onClick={closeCart} className="mt-7">
            Continue shopping
          </Button>
        </div>
      ) : (
        <div>
          {/* Free shipping progress */}
          <div className="border-b border-line bg-sand/50 px-5 py-4 sm:px-6">
            {qualifiesForFreeShipping ? (
              <p className="text-xs uppercase tracking-[0.14em] text-clay">
                Free delivery unlocked
              </p>
            ) : (
              <p className="text-xs text-slate">
                Add{' '}
                <span className="text-ink">{formatPrice(amountToFreeShipping)}</span> more for free
                delivery
              </p>
            )}
            <div className="mt-2.5 h-[3px] w-full bg-shell">
              <div
                className="h-full bg-clay transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <ul className="divide-y divide-line px-5 sm:px-6">
            {items.map((line) => (
              <li key={line.key} className="flex gap-4 py-5">
                <Link to={`/product/${line.product.id}`} onClick={closeCart} className="shrink-0">
                  <img
                    src={line.product.images[0]}
                    alt={line.product.name}
                    loading="lazy"
                    className="h-28 w-[5.5rem] bg-sand object-cover"
                  />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/product/${line.product.id}`}
                        onClick={closeCart}
                        className="block truncate text-sm text-ink hover:text-clay"
                      >
                        {line.product.name}
                      </Link>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted">
                        {line.size} / {line.color}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        removeItem(line.key);
                        toast('Removed from bag', { tone: 'info', description: line.product.name });
                      }}
                      aria-label={`Remove ${line.product.name} from bag`}
                      className="shrink-0 p-1 text-muted transition-colors hover:text-clay"
                    >
                      <Trash size={15} strokeWidth={1.4} />
                    </button>
                  </div>

                  <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                    <QuantitySelector
                      size="sm"
                      value={line.quantity}
                      onChange={(next) =>
                        next > line.quantity ? increment(line.key) : decrement(line.key)
                      }
                    />
                    <span className="text-sm tabular-nums text-ink">
                      {formatPrice(line.lineTotal)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Drawer>
  );
}
