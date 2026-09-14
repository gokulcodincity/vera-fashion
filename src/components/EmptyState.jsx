import { cx } from '../utils/format';

/** Shared empty state layout for the bag, wishlist and no-results views. */
export default function EmptyState({ icon: Icon, title, description, children, className }) {
  return (
    <div className={cx('flex flex-col items-center px-6 py-20 text-center', className)}>
      {Icon && (
        <span className="mb-7 flex h-16 w-16 items-center justify-center rounded-full border border-line bg-sand text-ink/70">
          <Icon size={22} strokeWidth={1.2} />
        </span>
      )}
      <h2 className="text-2xl sm:text-[1.9rem]">{title}</h2>
      {description && (
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate">{description}</p>
      )}
      {children && <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{children}</div>}
    </div>
  );
}
