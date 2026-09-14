import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  BadgeCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Ruler,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import Button from '../components/Button';
import Rating from '../components/Rating';
import SmartImage from '../components/SmartImage';
import QuantitySelector from '../components/QuantitySelector';
import WishlistButton from '../components/WishlistButton';
import Accordion from '../components/Accordion';
import SectionHeading from '../components/SectionHeading';
import ProductGrid from '../components/ProductGrid';
import SizeGuideModal from '../components/SizeGuideModal';
import PincodeChecker from '../components/PincodeChecker';
import RecentlyViewed from '../components/RecentlyViewed';
import MobilePurchaseBar from '../components/MobilePurchaseBar';
import { getProductById, relatedProducts } from '../data/products';
import { getProductBySlug, getVariant } from '../services/catalogue';
import { userMessage } from '../services/errors';
import { isSupabaseConfigured } from '../lib/supabase';
import { reviewsFor } from '../data/reviews';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import { useToast } from '../context/ToastContext';
import { store, whatsappLink } from '../config/store';
import { formatPrice, deliveryWindow, cx } from '../utils/format';

export default function ProductDetails() {
  const { id } = useParams();
  const staticProduct = getProductById(id);
  const [remoteProduct, setRemoteProduct] = useState(null);
  const [remoteLoading, setRemoteLoading] = useState(isSupabaseConfigured);
  const [remoteError, setRemoteError] = useState('');
  const product = isSupabaseConfigured ? remoteProduct : staticProduct;
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { openCart } = useUI();
  const { toast } = useToast();

  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    let active = true;
    setRemoteLoading(true);
    setRemoteError('');
    getProductBySlug(id).then((item) => { if (active) setRemoteProduct(item); }).catch((error) => { if (active) setRemoteError(userMessage(error, 'We could not load this style.')); }).finally(() => { if (active) setRemoteLoading(false); });
    return () => { active = false; };
  }, [id]);

  /* Reset local selections when navigating between products. */
  useEffect(() => {
    if (!product) return;
    setActiveImage(0);
    setQuantity(1);
    setSizeError(false);
    setColor(product.colors?.[0]?.name || '');
    setSize(product.sizes?.length === 1 ? product.sizes[0] : '');
  }, [product]);

  const reviews = useMemo(() => reviewsFor(staticProduct || product), [staticProduct, product]);
  const related = useMemo(() => relatedProducts(staticProduct || product, 4), [staticProduct, product]);

  if (remoteLoading) return <div className="shell py-24"><div className="h-[32rem] animate-pulse bg-sand" /></div>;
  if (!product) return remoteError ? <div className="shell py-24 text-center"><h1 className="text-3xl">Style unavailable</h1><p className="mt-3 text-slate">{remoteError}</p></div> : <Navigate to="/not-found" replace />;

  const needsSize = product.sizes.length > 1;
  const eta = deliveryWindow();

  const resolveSize = () => size || product.sizes?.[0] || 'One Size';
  const selectedVariant = getVariant(product, resolveSize(), color);
  const variantOutOfStock = Boolean(product.databaseId && (!selectedVariant || selectedVariant.stock_quantity < 1 || !selectedVariant.is_active));

  const handleAdd = ({ thenCheckout = false } = {}) => {
    if (needsSize && !size) {
      setSizeError(true);
      toast('Select a size to continue', { tone: 'info', description: product.name });
      document.getElementById('size-selector')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (variantOutOfStock) {
      toast('Selected variant is out of stock', { tone: 'info', description: `${color} / ${resolveSize()}` });
      return;
    }
    addItem(product, { size: resolveSize(), color, quantity, variantId: selectedVariant?.id });

    if (thenCheckout) {
      navigate('/checkout');
      return;
    }
    toast('Added to bag', { description: `${product.name} - ${resolveSize()}` });
    openCart();
  };

  const step = (direction) => {
    setActiveImage((current) => {
      const next = current + direction;
      if (next < 0) return product.images.length - 1;
      if (next >= product.images.length) return 0;
      return next;
    });
  };

  const accordionItems = [
    {
      id: 'details',
      title: 'Product details',
      content: (
        <ul className="space-y-2.5">
          {product.highlights.map((highlight) => (
            <li key={highlight} className="flex gap-3">
              <Check size={15} strokeWidth={1.4} className="mt-0.5 shrink-0 text-clay" />
              {highlight}
            </li>
          ))}
          <li className="flex gap-3">
            <Check size={15} strokeWidth={1.4} className="mt-0.5 shrink-0 text-clay" />
            {product.details.origin}
          </li>
        </ul>
      ),
    },
    {
      id: 'fabric',
      title: 'Fabric, fit and care',
      content: (
        <dl className="space-y-3">
          {[
            ['Fabric', product.details.fabric],
            ['Fit', product.details.fit],
            ['Care', product.details.care],
          ].map(([label, value]) => (
            <div key={label} className="grid gap-1 sm:grid-cols-[6rem_1fr] sm:gap-4">
              <dt className="text-[10px] uppercase tracking-[0.16em] text-muted">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ),
    },
    {
      id: 'shipping',
      title: 'Shipping and returns',
      content: (
        <ul className="space-y-2.5">
          <li>
            Free delivery on orders above{' '}
            {formatPrice(store.freeShippingThreshold)}, otherwise {formatPrice(store.deliveryFee)}.
          </li>
          <li>Estimated arrival {eta} for most pincodes in India.</li>
          <li>
            {store.returnWindowDays} day returns and one free size exchange, with reverse pickup at
            your door.
          </li>
        </ul>
      ),
    },
  ];

  return (
    <>
      <PageMeta
        title={product.name}
        description={`${product.name} - ${product.description.slice(0, 130)}`}
      />

      <div className="shell pt-8">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Shop', to: '/shop' },
            { label: product.category, to: `/shop?category=${encodeURIComponent(product.category)}` },
            { label: product.name },
          ]}
        />
      </div>

      <div className="shell pb-32 pt-7 lg:pb-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Gallery */}
          <div>
            <div className="relative">
              <SmartImage
                key={product.images[activeImage]}
                src={product.images[activeImage]}
                alt={`${product.name} - view ${activeImage + 1} of ${product.images.length}`}
                ratio="aspect-[4/5]"
                priority
                sizes="(min-width: 1024px) 48vw, 100vw"
                className="animate-fade-in"
              />

              {product.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center bg-cream/85 text-ink backdrop-blur-sm transition-colors hover:bg-cream"
                  >
                    <ChevronLeft size={18} strokeWidth={1.4} />
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center bg-cream/85 text-ink backdrop-blur-sm transition-colors hover:bg-cream"
                  >
                    <ChevronRight size={18} strokeWidth={1.4} />
                  </button>
                </>
              )}

              <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-1.5">
                {product.isNew && (
                  <span className="bg-ink px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] text-cream">
                    New
                  </span>
                )}
                {product.discount > 0 && (
                  <span className="bg-clay px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] text-cream">
                    {product.discount}% Off
                  </span>
                )}
              </div>
            </div>

            {product.images.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-3">
                {product.images.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`Show image ${index + 1}`}
                    aria-current={index === activeImage}
                    className={cx(
                      'overflow-hidden border transition-colors',
                      index === activeImage ? 'border-ink' : 'border-transparent hover:border-line'
                    )}
                  >
                    <img
                      src={image}
                      alt=""
                      loading="lazy"
                      className="aspect-[3/4] w-full bg-sand object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Purchase panel */}
          <div className="lg:pt-2">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted">
              {product.gender} / {product.category}
            </p>

            <h1 className="mt-3 text-[2.1rem] leading-[1.06] sm:text-[2.7rem]">{product.name}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <Rating value={product.rating} showValue />
              <a
                href="#reviews"
                className="text-xs text-slate underline-offset-4 transition-colors hover:text-ink hover:underline"
              >
                {product.reviewCount} reviews
              </a>
              {product.isBestSeller && (
                <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-clay">
                  <BadgeCheck size={13} strokeWidth={1.5} />
                  Best seller
                </span>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-baseline gap-3">
              <span className="font-display text-3xl tabular-nums text-ink">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <>
                  <span className="text-base tabular-nums text-muted line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <span className="bg-clay/10 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-clay">
                    Save {product.discount}%
                  </span>
                </>
              )}
            </div>
            <p className="mt-1.5 text-xs text-muted">Inclusive of all taxes</p>

            <p className="mt-6 max-w-lg text-sm leading-relaxed text-slate">
              {product.description}
            </p>

            {/* Colour */}
            {product.colors?.length > 0 && (
              <div className="mt-8">
                <div className="flex items-baseline justify-between">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-ink">Colour</p>
                  <p className="text-xs text-slate">{color}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {product.colors.map((swatch) => (
                    <button
                      key={swatch.name}
                      type="button"
                      onClick={() => setColor(swatch.name)}
                      aria-label={swatch.name}
                      aria-pressed={color === swatch.name}
                      title={swatch.name}
                      className={cx(
                        'flex h-9 w-9 items-center justify-center rounded-full border transition-all',
                        color === swatch.name
                          ? 'border-ink ring-1 ring-ink ring-offset-2 ring-offset-cream'
                          : 'border-line hover:border-ink/50'
                      )}
                    >
                      <span
                        className="h-6 w-6 rounded-full"
                        style={{ backgroundColor: swatch.hex }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size */}
            <div className="mt-8" id="size-selector">
              <div className="flex items-baseline justify-between">
                <p className="text-[10px] uppercase tracking-[0.22em] text-ink">
                  Size{needsSize && <span className="text-clay"> *</span>}
                </p>
                <button
                  type="button"
                  onClick={() => setGuideOpen(true)}
                  className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-slate transition-colors hover:text-ink"
                >
                  <Ruler size={13} strokeWidth={1.4} />
                  Size guide
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {product.sizes.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setSize(option);
                      setSizeError(false);
                    }}
                    aria-pressed={size === option}
                    className={cx(
                      'min-w-13 border px-3.5 py-3 text-[11px] uppercase tracking-[0.1em] transition-colors',
                      size === option
                        ? 'border-ink bg-ink text-cream'
                        : 'border-line bg-white text-ink hover:border-ink/60'
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {sizeError && (
                <p role="alert" className="mt-2.5 text-xs text-clay">
                  Please choose a size before adding to your bag.
                </p>
              )}
            </div>

            {/* Quantity + actions */}
            <div className="mt-8">
              <p className="mb-3 text-[10px] uppercase tracking-[0.22em] text-ink">Quantity</p>
              <QuantitySelector value={quantity} onChange={setQuantity} />
            </div>

            {variantOutOfStock && (
              <p role="status" className="mt-4 text-sm text-clay">Out of stock for {color} / {resolveSize()}. Choose another available option.</p>
            )}

            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
              <Button onClick={() => handleAdd()} size="lg" className="flex-1" disabled={variantOutOfStock}>
                {variantOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </Button>
              <Button
                onClick={() => handleAdd({ thenCheckout: true })}
                variant="outline"
                size="lg"
                className="flex-1"
                disabled={variantOutOfStock}
              >
                Buy Now
              </Button>
              <WishlistButton product={product} variant="inline" className="sm:w-auto" />
            </div>

            <a
              href={whatsappLink(`Hi ${store.storeNamePlain}, I would like to know more about the ${product.name}.`)}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-4 inline-block text-xs text-slate underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              Questions about fit? Ask us on WhatsApp
            </a>

            <PincodeChecker eta={eta} />

            {/* Service promises */}
            <ul className="mt-9 grid gap-4 border-y border-line py-7 sm:grid-cols-3">
              {[
                { Icon: Truck, title: 'Fast delivery', copy: eta },
                {
                  Icon: RotateCcw,
                  title: `${store.returnWindowDays} day returns`,
                  copy: 'Free reverse pickup',
                },
                { Icon: ShieldCheck, title: 'Quality checked', copy: 'Three stage inspection' },
              ].map(({ Icon, title, copy }) => (
                <li key={title} className="flex items-start gap-3">
                  <Icon size={17} strokeWidth={1.3} className="mt-0.5 shrink-0 text-clay" />
                  <span>
                    <span className="block text-[10px] uppercase tracking-[0.16em] text-ink">
                      {title}
                    </span>
                    <span className="mt-1 block text-xs text-slate">{copy}</span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Accordion items={accordionItems} defaultOpen="details" />
            </div>
          </div>
        </div>
      </div>

      <MobilePurchaseBar product={product} onAdd={() => handleAdd()} disabled={variantOutOfStock} />

      {/* Reviews */}
      <section id="reviews" className="border-t border-line bg-sand/40">
        <div className="shell py-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[18rem_1fr] lg:gap-16">
            <div>
              <p className="eyebrow">Reviews</p>
              <p className="mt-4 font-display text-5xl leading-none text-ink">
                {product.rating.toFixed(1)}
              </p>
              <Rating value={product.rating} className="mt-3" size={16} />
              <p className="mt-3 text-sm text-slate">
                Based on {product.reviewCount} verified purchases
              </p>
              <a
                href={whatsappLink(`Hi ${store.storeNamePlain}, I would like to share feedback about the ${product.name}.`)}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-6 inline-block text-[10px] uppercase tracking-[0.18em] text-ink underline-offset-4 transition-colors hover:text-clay hover:underline"
              >
                Share your feedback
              </a>
            </div>

            <ul className="space-y-5">
              {reviews.map((review) => (
                <li key={`${review.name}-${review.date}`} className="border border-line bg-white p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Rating value={review.rating} size={13} />
                      <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-clay">
                        <BadgeCheck size={12} strokeWidth={1.6} />
                        Verified
                      </span>
                    </div>
                    <span className="text-xs text-muted">{review.date}</span>
                  </div>
                  <h3 className="mt-3.5 font-display text-xl text-ink">{review.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate">{review.body}</p>
                  <p className="mt-4 text-[10px] uppercase tracking-[0.16em] text-muted">
                    {review.name}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <RecentlyViewed product={product} />

      {/* Related */}
      {related.length > 0 && (
        <section className="shell py-16 lg:py-24">
          <SectionHeading
            eyebrow="You may also like"
            title="Complete the look"
            titleId="related-heading"
            linkTo={`/shop?category=${encodeURIComponent(product.category)}`}
            linkLabel={`More ${product.category.toLowerCase()}`}
            className="mb-12"
          />
          <ProductGrid products={related} columns="four" />
        </section>
      )}

      <SizeGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  );
}
