import { Star } from 'lucide-react';
import { cx } from '../utils/format';

/**
 * Five point star rating. Half values are rendered with a clipped overlay so
 * a 4.5 reads correctly rather than being rounded away.
 */
export default function Rating({ value = 0, size = 14, showValue = false, className }) {
  const rounded = Math.round(value * 2) / 2;

  return (
    <div className={cx('flex items-center gap-1.5', className)}>
      <span
        className="flex items-center gap-0.5"
        role="img"
        aria-label={`Rated ${value} out of 5`}
      >
        {[1, 2, 3, 4, 5].map((index) => {
          const filled = rounded >= index;
          const half = !filled && rounded >= index - 0.5;
          return (
            <span key={index} className="relative inline-flex">
              <Star
                size={size}
                strokeWidth={1.25}
                className={filled ? 'fill-clay text-clay' : 'fill-transparent text-ink/25'}
              />
              {half && (
                <span className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                  <Star size={size} strokeWidth={1.25} className="fill-clay text-clay" />
                </span>
              )}
            </span>
          );
        })}
      </span>
      {showValue && (
        <span className="text-xs font-normal text-slate">{value.toFixed(1)}</span>
      )}
    </div>
  );
}
