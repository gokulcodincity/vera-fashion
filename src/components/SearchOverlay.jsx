import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Search, X } from 'lucide-react';
import { products } from '../data/products';
import { searchProducts } from '../utils/catalogue';
import { useUI } from '../context/UIContext';
import useFocusTrap from '../hooks/useFocusTrap';
import useScrollLock from '../hooks/useScrollLock';
import { formatPrice } from '../utils/format';

const SUGGESTIONS = ['Dresses', 'Linen shirt', 'Denim', 'Saree', 'Jackets', 'Sneakers'];

/** Full-screen search with live, ranked results. */
export default function SearchOverlay() {
  const { isSearchOpen, closeSearch } = useUI();
  const [term, setTerm] = useState('');
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  useScrollLock(isSearchOpen);
  useFocusTrap(isSearchOpen, panelRef, { initialFocusRef: inputRef, onEscape: closeSearch });

  useEffect(() => {
    if (!isSearchOpen) setTerm('');
  }, [isSearchOpen]);

  const results = useMemo(() => searchProducts(products, term, 6), [term]);
  const hasQuery = term.trim().length >= 2;

  const submit = (event) => {
    event.preventDefault();
    if (!term.trim()) return;
    closeSearch();
    navigate(`/shop?q=${encodeURIComponent(term.trim())}`);
  };

  if (!isSearchOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <button type="button" aria-label="Close search" onClick={closeSearch} className="absolute inset-0 animate-fade-in cursor-default bg-ink/45 backdrop-blur-[3px]" />
      <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Search products" className="relative max-h-[100dvh] animate-slide-down overflow-y-auto bg-cream outline-none">
        <div className="shell py-6 sm:py-8">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Search</p>
            <button type="button" onClick={closeSearch} aria-label="Close search" className="flex h-9 w-9 items-center justify-center text-ink transition-colors hover:text-clay"><X size={19} strokeWidth={1.4} /></button>
          </div>

          <form onSubmit={submit} className="mt-5 flex items-center gap-4 border-b border-ink/20 pb-4">
            <Search size={20} strokeWidth={1.3} className="shrink-0 text-muted" />
            <input ref={inputRef} value={term} onChange={(event) => setTerm(event.target.value)} type="search" placeholder="What are you looking for?" aria-label="Search products" className="w-full bg-transparent font-display text-2xl outline-none placeholder:text-muted/70 sm:text-4xl" />
            {term && <button type="button" onClick={() => { setTerm(''); inputRef.current?.focus(); }} className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-ink">Clear</button>}
          </form>

          {!hasQuery && (
            <div className="mt-8 pb-4">
              <p className="eyebrow mb-4">Popular searches</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion) => <button key={suggestion} type="button" onClick={() => setTerm(suggestion)} className="border border-line bg-white px-4 py-2 text-xs text-ink transition-colors hover:border-ink hover:bg-ink hover:text-cream">{suggestion}</button>)}
              </div>
            </div>
          )}

          {hasQuery && results.length === 0 && <div className="py-16 text-center"><h2 className="text-2xl sm:text-3xl">No styles found.</h2><p className="mx-auto mt-3 max-w-sm text-sm text-slate">We could not match that search. Try a category like dresses, shirts or denim.</p></div>}

          {hasQuery && results.length > 0 && (
            <div className="mt-8 pb-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="eyebrow">{results.length} {results.length === 1 ? 'result' : 'results'}</p>
                <button type="button" onClick={submit} className="group inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-ink transition-colors hover:text-clay">View all in shop<ArrowRight size={13} strokeWidth={1.5} className="transition-transform group-hover:translate-x-1" /></button>
              </div>
              <ul className="divide-y divide-line border-t border-line">
                {results.map((product) => <li key={product.id}><Link to={`/product/${product.id}`} onClick={closeSearch} className="group flex items-center gap-4 py-3.5 transition-colors hover:bg-sand/60"><img src={product.images[0]} alt={product.name} loading="lazy" className="h-20 w-16 shrink-0 bg-sand object-cover" /><span className="min-w-0 flex-1"><span className="block text-[10px] uppercase tracking-[0.18em] text-muted">{product.gender} / {product.category}</span><span className="mt-1 block truncate text-sm text-ink">{product.name}</span><span className="mt-1 block text-sm tabular-nums text-slate">{formatPrice(product.price)}</span></span><ArrowRight size={16} strokeWidth={1.3} className="shrink-0 text-muted transition-all group-hover:translate-x-1 group-hover:text-ink" /></Link></li>)}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
