import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash, Truck } from 'lucide-react';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import Button from '../components/Button';
import QuantitySelector from '../components/QuantitySelector';
import EmptyState from '../components/EmptyState';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { formatPrice, pluralise, deliveryWindow } from '../utils/format';
import { store } from '../config/store';

export default function Cart() {
  const {
    items,
    totalItems,
    subtotal,
    savings,
    listTotal,
    delivery,
    total,
    increment,
    decrement,
    removeItem,
    clearCart,
    qualifiesForFreeShipping,
    amountToFreeShipping,
    isEmpty,
  } = useCart();
  const { add: addToWishlist, isWishlisted } = useWishlist();
  const { toast } = useToast();

  const moveToWishlist = (line) => {
    if (!isWishlisted(line.productId)) addToWishlist(line.productId);
    removeItem(line.key);
    toast('Moved to wishlist', { tone: 'wishlist', description: line.product.name });
  };

  return (
    <>
      <PageMeta
        title="Shopping Bag"
        description="Review the pieces in your VERA bag and check out securely with cash on delivery, UPI or card."
      />

      <div className="shell pt-8">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Bag' }]} />
      </div>

      {isEmpty ? (
        <div className="shell pb-24 pt-6">
          <h1 className="text-[2.4rem] leading-none sm:text-[3.2rem]">Shopping Bag</h1>
          <div className="mt-8 border border-line bg-white">
            <EmptyState
              icon={ShoppingBag}
              title="Your bag is waiting."
              description="You have not added anything yet. Browse the new season and start building your edit."
            >
              <Button to="/shop">Continue Shopping</Button>
              <Button to="/wishlist" variant="outline">
                View wishlist
              </Button>
            </EmptyState>
          </div>
        </div>
      ) : (
        <div className="shell pb-24 pt-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-[2.4rem] leading-none sm:text-[3.2rem]">Shopping Bag</h1>
              <p className="mt-3 text-sm text-slate">{pluralise(totalItems, 'item')} in your bag</p>
            </div>
            <button
              type="button"
              onClick={() => {
                clearCart();
                toast('Bag cleared', { tone: 'info' });
              }}
              className="text-[10px] uppercase tracking-[0.18em] text-muted underline-offset-4 transition-colors hover:text-clay hover:underline"
            >
              Clear bag
            </button>
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-14 xl:grid-cols-[1fr_24rem]">
            {/* Lines */}
            <div>
              <div className="mb-6 flex items-center gap-3 border border-line bg-sand/50 px-4 py-3.5 text-xs text-slate">
                <Truck size={15} strokeWidth={1.4} className="shrink-0 text-clay" />
                {qualifiesForFreeShipping ? (
                  <span>
                    Free delivery applied. Estimated arrival{' '}
                    <span className="text-ink">{deliveryWindow()}</span>.
                  </span>
                ) : (
                  <span>
                    Add <span className="text-ink">{formatPrice(amountToFreeShipping)}</span> more to
                    unlock free delivery.
                  </span>
                )}
              </div>

              <ul className="divide-y divide-line border-y border-line">
                {items.map((line) => (
                  <li key={line.key} className="flex gap-4 py-6 sm:gap-6">
                    <Link to={`/product/${line.product.id}`} className="shrink-0">
                      <img
                        src={line.product.images[0]}
                        alt={line.product.name}
                        loading="lazy"
                        className="h-36 w-27 bg-sand object-cover sm:h-44 sm:w-33"
                      />
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">
                            {line.product.category}
                          </p>
                          <h2 className="mt-1.5 font-sans text-[0.95rem] leading-snug">
                            <Link
                              to={`/product/${line.product.id}`}
                              className="link-underline text-ink"
                            >
                              {line.product.name}
                            </Link>
                          </h2>
                          <dl className="mt-2.5 space-y-1 text-xs text-slate">
                            <div className="flex gap-2">
                              <dt className="text-muted">Size</dt>
                              <dd>{line.size}</dd>
                            </div>
                            <div className="flex gap-2">
                              <dt className="text-muted">Colour</dt>
                              <dd>{line.color}</dd>
                            </div>
                          </dl>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-[0.95rem] tabular-nums text-ink">
                            {formatPrice(line.lineTotal)}
                          </p>
                          {line.product.originalPrice && (
                            <p className="mt-1 text-xs tabular-nums text-muted line-through">
                              {formatPrice(line.product.originalPrice * line.quantity)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-5">
                        <QuantitySelector
                          size="sm"
                          value={line.quantity}
                          onChange={(next) =>
                            next > line.quantity ? increment(line.key) : decrement(line.key)
                          }
                        />
                        <button
                          type="button"
                          onClick={() => moveToWishlist(line)}
                          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-slate transition-colors hover:text-clay"
                        >
                          <Heart size={13} strokeWidth={1.5} />
                          Move to wishlist
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            removeItem(line.key);
                            toast('Removed from bag', {
                              tone: 'info',
                              description: line.product.name,
                            });
                          }}
                          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-slate transition-colors hover:text-clay"
                        >
                          <Trash size={13} strokeWidth={1.5} />
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Button to="/shop" variant="quiet" size="sm" className="px-0">
                  Continue shopping
                </Button>
              </div>
            </div>

            {/* Summary */}
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="border border-line bg-white p-6">
                <h2 className="text-[11px] font-normal uppercase tracking-[0.24em] text-ink">
                  Order Summary
                </h2>

                <dl className="mt-6 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate">Bag total</dt>
                    <dd className="tabular-nums">{formatPrice(listTotal)}</dd>
                  </div>
                  {savings > 0 && (
                    <div className="flex justify-between text-clay">
                      <dt>Discount</dt>
                      <dd className="tabular-nums">-{formatPrice(savings)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-slate">Subtotal</dt>
                    <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate">Delivery</dt>
                    <dd className="tabular-nums">
                      {delivery === 0 ? 'Free' : formatPrice(delivery)}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between border-t border-line pt-4">
                    <dt className="text-base">Total</dt>
                    <dd className="font-display text-2xl tabular-nums">{formatPrice(total)}</dd>
                  </div>
                </dl>

                {savings > 0 && (
                  <p className="mt-4 bg-clay/8 px-3 py-2.5 text-xs text-clay">
                    You are saving {formatPrice(savings)} on this order.
                  </p>
                )}

                <Button to="/checkout" full size="lg" className="mt-6">
                  Proceed to Checkout
                </Button>

                <p className="mt-4 text-center text-[10px] uppercase tracking-[0.16em] text-muted">
                  Cash on delivery available
                </p>
              </div>

              <div className="mt-4 border border-line bg-sand/40 p-5 text-xs leading-relaxed text-slate">
                <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-ink">Need help?</p>
                Call us at {store.phone} between 10:30 AM and 9:00 PM, or message us on WhatsApp any
                time.
              </div>
            </aside>
          </div>
        </div>
      )}
    </>
  );
}
