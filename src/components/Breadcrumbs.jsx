import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/** `items` is an array of { label, to } - the last entry renders as text. */
export default function Breadcrumbs({ items = [] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {isLast || !item.to ? (
                <span className={isLast ? 'text-ink' : undefined}>{item.label}</span>
              ) : (
                <Link to={item.to} className="transition-colors hover:text-ink">
                  {item.label}
                </Link>
              )}
              {!isLast && <ChevronRight size={11} strokeWidth={1.5} className="text-muted/60" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
