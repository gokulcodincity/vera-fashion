import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, X } from 'lucide-react';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import Rating from '../components/Rating';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import { useToast } from '../context/ToastContext';
import { formatPrice, pluralise } from '../utils/format';

export default function Wishlist() {
  const { items, remove, clear, isEmpty } = useWishlist();
  const { addItem } = useCart();
  const { openCart } = useUI();
  const { toast } = useToast();

  const moveToBag = (product) => {
    const size = product.sizes?.length === 1 ? product.sizes[0] : product.sizes?.[0] || 'One Size';
    addItem(product, { size, color: product.colors?.[0]?.name, quantity: 1 });
    remove(product.id);
    toast('Moved to bag', { description: `${product.name} - ${size}` });
    openCart();
  };

  return (
    <>
      <PageMeta
        title="Wishlist"
        description="Your saved VERA pieces, kept in your browser so they are here when you return."
      />

      <div className="shell pt-8">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Wishlist' }]} />
      </div>

      <div className="shell pb-24 pt-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[2.4rem] leading-none sm:text-[3.2rem]">Wishlist</h1>
            {!isEmpty && (
              <p className="mt-3 text-sm text-slate">{pluralise(items.length, 'piece')} saved</p>
            )}
          </div>
          {!isEmpty && (
            <button
              type="button"
              onClick={() => {
                clear();
                toast('Wishlist cleared', { tone: 'info' });
              }}
              className="text-[10px] uppercase tracking-[0.18em] text-muted underline-offset-4 transition-colors hover:text-clay hover:underline"
            >
              Clear wishlist
            </button>
          )}
        </div>

        {isEmpty ? (
          <div className="mt-8 border border-line bg-white">
            <EmptyState
              icon={Heart}
              title="Your wishlist is waiting for something special."
              description="Tap the heart on any piece to save it here. Your list stays in this browser, so it will be here when you return."
            >
              <Button to="/shop">Browse the collection</Button>
              <Button to="/shop?tag=new" variant="outline">
                See new arrivals
              </Button>
            </EmptyState>
          </div>
        ) : (
          <ul className="mt-10 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((product) => (
              <li key={product.id} className="group flex flex-col">
                <div className="relative overflow-hidden bg-sand">
                  <Link to={`/product/${product.id}`} aria-label={`View ${product.name}`}>
                    <img
                      src={product.images[0]}
                      alt={`${product.name} - ${product.category}`}
                      loading="lazy"
                      className="aspect-[3/4] w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                    />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      remove(product.id);
                      toast('Removed from wishlist', { tone: 'info', description: product.name });
                    }}
                    aria-label={`Remove ${product.name} from wishlist`}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center border border-ink/10 bg-cream/90 text-ink backdrop-blur-sm transition-colors hover:bg-cream hover:text-clay"
                  >
                    <X size={15} strokeWidth={1.5} />
                  </button>
                  {product.discount > 0 && (
                    <span className="absolute left-3 top-3 bg-clay px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] text-cream">
                      {product.discount}% Off
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col pt-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted">
                    {product.category}
                  </p>
                  <h2 className="mt-1.5 font-sans text-[0.9rem] font-normal leading-snug">
                    <Link to={`/product/${product.id}`} className="link-underline text-ink">
                      {product.name}
                    </Link>
                  </h2>
                  <Rating value={product.rating} size={12} className="mt-2" />
                  <div className="mt-2 flex items-baseline gap-2.5">
                    <span className="text-[0.9rem] tabular-nums text-ink">
                      {formatPrice(product.price)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-xs tabular-nums text-muted line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>

                  <Button
                    onClick={() => moveToBag(product)}
                    size="sm"
                    full
                    className="mt-4"
                    aria-label={`Move ${product.name} to bag`}
                  >
                    <ShoppingBag size={13} strokeWidth={1.6} />
                    Move to bag
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
