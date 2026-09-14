import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, ShoppingBag } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import Rating from './Rating';
import SmartImage from './SmartImage';
import { getProductById } from '../data/products';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useUI } from '../context/UIContext';
import { cx, formatPrice } from '../utils/format';

/** A compact product preview that keeps a shopper in the catalogue. */
export default function QuickViewModal() {
  const { quickViewProductId, closeQuickView, openCart } = useUI();
  const { addItem } = useCart();
  const { toast } = useToast();
  const product = quickViewProductId
    ? (typeof quickViewProductId === 'object' ? quickViewProductId : getProductById(quickViewProductId))
    : null;
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [sizeError, setSizeError] = useState(false);

  useEffect(() => {
    if (!product) return;
    setSize(product.sizes?.length === 1 ? product.sizes[0] : '');
    setColor(product.colors?.[0]?.name || '');
    setSizeError(false);
  }, [product]);

  if (!product) return null;

  const needsSize = product.sizes?.length > 1;
  const resolvedSize = size || product.sizes?.[0] || 'One Size';
  const addToBag = () => {
    if (needsSize && !size) {
      setSizeError(true);
      return;
    }
    const resolvedSize = size || product.sizes?.[0] || 'One Size';
    const variant = product.variants?.find((item) => item.size === resolvedSize && item.color === color);
    if (product.databaseId && (!variant || !variant.is_active || variant.stock_quantity < 1)) {
      toast('Selected variant is out of stock', { tone: 'info', description: product.name });
      return;
    }
    addItem(product, { size: resolvedSize, color, quantity: 1, variantId: variant?.id });
    closeQuickView();
    toast('Added to bag', { description: `${product.name} - ${resolvedSize}` });
    openCart();
  };

  return (
    <Modal
      open={Boolean(product)}
      onClose={closeQuickView}
      title="Quick view"
      description="Choose your details and add this style without leaving the collection."
      size="lg"
    >
      <div className="mt-7 grid gap-7 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] sm:gap-9">
        <SmartImage
          src={product.images[0]}
          alt={`${product.name} in ${product.colors?.[0]?.name || 'signature'} - ${product.category}`}
          ratio="aspect-[3/4]"
          sizes="(min-width: 640px) 32vw, 85vw"
        />
        <div className="flex min-w-0 flex-col">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted">{product.gender} / {product.category}</p>
          <h3 className="mt-2 font-display text-3xl leading-tight text-ink">{product.name}</h3>
          <Rating value={product.rating} showValue className="mt-3" />
          <div className="mt-5 flex items-baseline gap-2.5">
            <span className="text-xl tabular-nums text-ink">{formatPrice(product.price)}</span>
            {product.originalPrice && <span className="text-sm tabular-nums text-muted line-through">{formatPrice(product.originalPrice)}</span>}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate">{product.description}</p>

          {product.colors?.length > 0 && (
            <div className="mt-6">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[10px] uppercase tracking-[0.2em] text-ink">Colour</span>
                <span className="text-xs text-slate">{color}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.colors.map((swatch) => (
                  <button
                    key={swatch.name}
                    type="button"
                    onClick={() => setColor(swatch.name)}
                    aria-label={swatch.name}
                    aria-pressed={color === swatch.name}
                    className={cx(
                      'flex h-8 w-8 items-center justify-center rounded-full border transition-colors',
                      color === swatch.name ? 'border-ink ring-1 ring-ink ring-offset-2 ring-offset-cream' : 'border-line hover:border-ink/60'
                    )}
                  >
                    <span className="h-5 w-5 rounded-full" style={{ backgroundColor: swatch.hex }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <span className="text-[10px] uppercase tracking-[0.2em] text-ink">Size{needsSize && <span className="text-clay"> *</span>}</span>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.sizes.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => { setSize(option); setSizeError(false); }}
                  aria-pressed={size === option}
                  className={cx(
                    'min-w-12 border px-3 py-2.5 text-[10px] uppercase tracking-[0.12em] transition-colors',
                    size === option ? 'border-ink bg-ink text-cream' : 'border-line bg-white hover:border-ink/60'
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
            {sizeError && <p role="alert" className="mt-2 text-xs text-clay">Please select a size before adding to your bag.</p>}
          </div>

          <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
            <Button onClick={addToBag} size="md" full><ShoppingBag size={15} strokeWidth={1.5} />Add to Bag</Button>
            <Link to={`/product/${product.id}`} onClick={closeQuickView} className="inline-flex items-center justify-center gap-2 border border-ink/25 px-5 py-3 text-[10px] uppercase tracking-[0.2em] text-ink transition-colors hover:border-ink hover:bg-ink hover:text-cream">
              <Eye size={15} strokeWidth={1.5} />Full details
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
}
