import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cx } from '../utils/format';

/** Editorial section header with an optional right-aligned link. */
export default function SectionHeading({
  eyebrow,
  title,
  titleId,
  subtitle,
  align = 'left',
  linkTo,
  linkLabel,
  className,
}) {
  const centred = align === 'center';

  return (
    <div
      className={cx(
        'flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between',
        centred && 'sm:flex-col sm:items-center sm:text-center',
        className
      )}
    >
      <div className={cx('max-w-xl', centred && 'mx-auto text-center')}>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 id={titleId} className="text-[2rem] leading-[1.1] sm:text-[2.6rem] lg:text-[3rem]">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate sm:text-[0.95rem]">
            {subtitle}
          </p>
        )}
      </div>

      {linkTo && linkLabel && (
        <Link
          to={linkTo}
          className="group inline-flex shrink-0 items-center gap-2 text-[11px] font-normal uppercase tracking-[0.22em] text-ink transition-colors hover:text-clay"
        >
          <span className="link-underline">{linkLabel}</span>
          <ArrowRight
            size={14}
            strokeWidth={1.4}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </Link>
      )}
    </div>
  );
}
