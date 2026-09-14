import { Check, X } from 'lucide-react';
import { CATEGORIES, GENDERS, SIZE_GROUPS } from '../data/products';
import { PRICE_BANDS, countActiveFilters } from '../utils/catalogue';
import { cx } from '../utils/format';

function Group({ title, children }) {
  return (
    <section className="border-b border-line py-6 first:pt-0">
      <h3 className="mb-4 text-[10px] font-normal uppercase tracking-[0.24em] text-ink">{title}</h3>
      {children}
    </section>
  );
}

function CheckRow({ label, checked, onChange, count }) {
  return (
    <label className="group flex cursor-pointer items-center gap-3 py-1.5 text-sm text-slate transition-colors hover:text-ink">
      <span className={cx('flex h-4 w-4 shrink-0 items-center justify-center border transition-colors', checked ? 'border-ink bg-ink text-cream' : 'border-line bg-white group-hover:border-ink/50')}>
        {checked && <Check size={11} strokeWidth={2.2} />}
      </span>
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
      <span className="flex-1">{label}</span>
      {typeof count === 'number' && <span className="text-xs tabular-nums text-muted">{count}</span>}
    </label>
  );
}

function SizePill({ size, active, onClick }) {
  return <button type="button" onClick={onClick} aria-pressed={active} className={cx('min-w-11 border px-2.5 py-2 text-[11px] uppercase tracking-[0.1em] transition-colors', active ? 'border-ink bg-ink text-cream' : 'border-line bg-white text-ink hover:border-ink/50')}>{size}</button>;
}

/** Rendered inline as a desktop sidebar and inside the mobile filter drawer. */
export default function ProductFilters({
  filters,
  onChange,
  onClear,
  counts = {},
  categories = CATEGORIES,
  genders = GENDERS,
  sizeGroups = SIZE_GROUPS,
}) {
  const activeCount = countActiveFilters(filters);
  const toggleArrayValue = (key, value) => {
    const list = filters[key];
    onChange({ ...filters, [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value] });
  };

  return (
    <div>
      <div className="flex items-center justify-between border-b border-line pb-4">
        <p className="text-[10px] uppercase tracking-[0.24em] text-muted">{activeCount > 0 ? `${activeCount} applied` : 'Refine'}</p>
        {activeCount > 0 && <button type="button" onClick={onClear} className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-ink transition-colors hover:text-clay"><X size={12} strokeWidth={1.6} />Clear all</button>}
      </div>
      <Group title="Category"><div className="-mt-1">{categories.map((category) => <CheckRow key={category} label={category} count={counts.categories?.[category]} checked={filters.categories.includes(category)} onChange={() => toggleArrayValue('categories', category)} />)}</div></Group>
      <Group title="Shop for"><div className="-mt-1">{genders.map((gender) => <CheckRow key={gender} label={gender} count={counts.genders?.[gender]} checked={filters.genders.includes(gender)} onChange={() => toggleArrayValue('genders', gender)} />)}</div></Group>
      <Group title="Size"><div className="space-y-4">{sizeGroups.map((group) => <div key={group.label}><p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-muted">{group.label}</p><div className="flex flex-wrap gap-1.5">{group.sizes.map((size) => <SizePill key={size} size={size} active={filters.sizes.includes(size)} onClick={() => toggleArrayValue('sizes', size)} />)}</div></div>)}</div></Group>
      <Group title="Price"><div className="-mt-1">{PRICE_BANDS.map((band) => <CheckRow key={band.id} label={band.label} checked={filters.priceBands.includes(band.id)} onChange={() => toggleArrayValue('priceBands', band.id)} />)}</div></Group>
      <Group title="Offers"><CheckRow label="On sale only" checked={filters.onSale} onChange={() => onChange({ ...filters, onSale: !filters.onSale })} /></Group>
    </div>
  );
}
