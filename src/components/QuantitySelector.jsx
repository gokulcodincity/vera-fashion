import { Minus, Plus } from 'lucide-react';
import { cx } from '../utils/format';

/** Accessible stepper used on the product page, bag drawer and cart. */
export default function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 10,
  size = 'md',
  label = 'Quantity',
  className,
}) {
  const dimensions = size === 'sm' ? 'h-9 w-9' : 'h-11 w-11';
  const textSize = size === 'sm' ? 'text-xs w-8' : 'text-sm w-10';

  return (
    <div
      className={cx('inline-flex items-center border border-line bg-white', className)}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className={cx(
          dimensions,
          'flex items-center justify-center text-ink transition-colors hover:bg-sand disabled:cursor-not-allowed disabled:text-muted/50 disabled:hover:bg-transparent'
        )}
      >
        <Minus size={14} strokeWidth={1.5} />
      </button>
      <span
        className={cx('text-center tabular-nums', textSize)}
        aria-live="polite"
        aria-label={`${label}: ${value}`}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
        className={cx(
          dimensions,
          'flex items-center justify-center text-ink transition-colors hover:bg-sand disabled:cursor-not-allowed disabled:text-muted/50 disabled:hover:bg-transparent'
        )}
      >
        <Plus size={14} strokeWidth={1.5} />
      </button>
    </div>
  );
}
