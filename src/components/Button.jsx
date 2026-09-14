import { Link } from 'react-router-dom';
import { cx } from '../utils/format';

const BASE =
  'group relative inline-flex items-center justify-center gap-2.5 whitespace-nowrap font-sans font-normal uppercase transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] disabled:pointer-events-none disabled:opacity-45';

const VARIANTS = {
  primary: 'bg-ink text-cream hover:bg-clay',
  outline: 'border border-ink/25 text-ink hover:border-ink hover:bg-ink hover:text-cream',
  light: 'bg-cream text-ink hover:bg-clay hover:text-cream',
  ghostLight: 'border border-cream/35 text-cream hover:bg-cream hover:text-ink',
  subtle: 'bg-sand text-ink hover:bg-shell',
  quiet: 'text-ink hover:text-clay',
};

const SIZES = {
  sm: 'px-5 py-2.5 text-[10px] tracking-[0.2em]',
  md: 'px-7 py-3.5 text-[11px] tracking-[0.22em]',
  lg: 'px-9 py-[1.15rem] text-[11px] tracking-[0.26em]',
};

/**
 * The single button primitive used across the store.
 * Renders as <button>, <Link> (when `to` is set) or <a> (when `href` is set).
 */
export default function Button({
  as,
  to,
  href,
  variant = 'primary',
  size = 'md',
  full = false,
  className,
  children,
  ...rest
}) {
  const classes = cx(
    BASE,
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    full && 'w-full',
    className
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a className={classes} href={href} {...rest}>
        {children}
      </a>
    );
  }

  const Component = as || 'button';
  return (
    <Component className={classes} type={Component === 'button' ? 'button' : undefined} {...rest}>
      {children}
    </Component>
  );
}
