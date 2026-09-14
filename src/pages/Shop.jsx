import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigationType, useSearchParams } from 'react-router-dom';
import { Funnel, X } from 'lucide-react';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import ProductGrid from '../components/ProductGrid';
import ProductFilters from '../components/ProductFilters';
import Drawer from '../components/Drawer';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import { useUI } from '../context/UIContext';
import { products as staticProducts, CATEGORIES as STATIC_CATEGORIES, GENDERS, SORT_OPTIONS } from '../data/products';
import {
  PRICE_BANDS,
  countActiveFilters,
  filterProducts,
  sortProducts,
} from '../utils/catalogue';
import { pluralise } from '../utils/format';
import { getCataloguePage, getCategories } from '../services/catalogue';
import { isSupabaseConfigured } from '../lib/supabase';

const PAGE_SIZE = 15;
const LOAD_DELAY = 280;

const TAG_LABELS = {
  new: 'New Arrivals',
  bestseller: 'Best Sellers',
  sale: 'On Sale',
};

const splitParam = (value) => (value ? value.split(',').filter(Boolean) : []);

const readShopState = (key) => {
  try {
    const value = JSON.parse(window.sessionStorage.getItem(key));
    return value && typeof value === 'object' ? value : null;
  } catch {
    return null;
  }
};

const saveShopState = (key, value) => {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* session storage can be unavailable in private browsing */
  }
};

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const navigationType = useNavigationType();
  const { openQuickView } = useUI();
  const [catalogueProducts, setCatalogueProducts] = useState(staticProducts);
  const [catalogueCategories, setCatalogueCategories] = useState(STATIC_CATEGORIES);
  const [catalogueLoading, setCatalogueLoading] = useState(isSupabaseConfigured);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [booting, setBooting] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isObserverReady, setIsObserverReady] = useState(false);
  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);
  const loadTimerRef = useRef(null);
  const visibleCountRef = useRef(visibleCount);

  const filters = useMemo(
    () => ({
      q: params.get('q') || '',
      categories: splitParam(params.get('category')),
      genders: splitParam(params.get('gender')),
      sizes: splitParam(params.get('size')),
      priceBands: splitParam(params.get('price')),
      onSale: params.get('sale') === '1',
      tag: params.get('tag') || '',
    }),
    [params]
  );

  const sort = params.get('sort') || 'featured';
  const paramKey = params.toString();
  const shopStateKey = `vera:shop-state:v1:${paramKey}`;

  /* Brief skeleton on first paint so the grid never pops in half-drawn. */
  useEffect(() => {
    const timer = window.setTimeout(() => setBooting(false), 260);
    return () => window.clearTimeout(timer);
  }, []);

  /* Keep the existing UX available without configuration, but use the live public
     catalogue/category policies whenever the project has been configured. */
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setCatalogueProducts(staticProducts);
      setCatalogueCategories(STATIC_CATEGORIES);
      setCatalogueLoading(false);
      return undefined;
    }
    let active = true;
    setCatalogueLoading(true);
    Promise.all([getCataloguePage({ pageSize: 1000 }), getCategories()])
      .then(([catalogue, categories]) => {
        if (!active) return;
        setCatalogueProducts(catalogue.items);
        setCatalogueCategories(categories.map((category) => category.name));
      })
      .catch(() => {
        // Preserve the existing storefront if the remote catalogue is temporarily unavailable.
        if (active) {
          setCatalogueProducts(staticProducts);
          setCatalogueCategories(STATIC_CATEGORIES);
        }
      })
      .finally(() => {
        if (active) setCatalogueLoading(false);
      });
    return () => { active = false; };
  }, []);


  useEffect(() => {
    return () => window.clearTimeout(loadTimerRef.current);
  }, []);

  const writeFilters = (next, nextSort = sort) => {
    const search = new URLSearchParams();
    if (next.q) search.set('q', next.q);
    if (next.categories.length) search.set('category', next.categories.join(','));
    if (next.genders.length) search.set('gender', next.genders.join(','));
    if (next.sizes.length) search.set('size', next.sizes.join(','));
    if (next.priceBands.length) search.set('price', next.priceBands.join(','));
    if (next.onSale) search.set('sale', '1');
    if (next.tag) search.set('tag', next.tag);
    if (nextSort && nextSort !== 'featured') search.set('sort', nextSort);
    setParams(search, { replace: true });
  };

  const clearAll = () =>
    writeFilters({
      q: '',
      categories: [],
      genders: [],
      sizes: [],
      priceBands: [],
      onSale: false,
      tag: '',
    });

  const products = catalogueProducts;
  const results = useMemo(
    () => sortProducts(filterProducts(products, filters), sort),
    [products, filters, sort]
  );

  /* Filter and sort changes begin at fifteen; browser Back restores this exact Shop view. */
  useEffect(() => {
    window.clearTimeout(loadTimerRef.current);
    loadingRef.current = false;
    setIsLoadingMore(false);
    setIsObserverReady(false);

    const saved = navigationType === 'POP' ? readShopState(shopStateKey) : null;
    const restoredCount = saved
      ? Math.min(Math.max(Number(saved.visibleCount) || PAGE_SIZE, PAGE_SIZE), results.length)
      : PAGE_SIZE;
    setVisibleCount(restoredCount);

    const readyTimer = window.setTimeout(() => setIsObserverReady(true), 0);
    if (saved && Number.isFinite(saved.scrollY)) {
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => window.scrollTo({ top: saved.scrollY, left: 0, behavior: 'auto' })));
    }
    return () => window.clearTimeout(readyTimer);
  }, [navigationType, results.length, shopStateKey]);

  useEffect(() => {
    visibleCountRef.current = visibleCount;
  }, [visibleCount]);

  useEffect(() => {
    return () => saveShopState(shopStateKey, { visibleCount: visibleCountRef.current, scrollY: window.scrollY });
  }, [shopStateKey]);

  const counts = useMemo(() => {
    const categories = {};
    catalogueCategories.forEach((category) => {
      categories[category] = filterProducts(products, { ...filters, categories: [category] }).length;
    });
    const genders = {};
    GENDERS.forEach((gender) => {
      genders[gender] = filterProducts(products, { ...filters, genders: [gender] }).length;
    });
    return { categories, genders };
  }, [catalogueCategories, products, filters]);

  const activeCount = countActiveFilters(filters);
  const visible = results.slice(0, visibleCount);
  const hasMore = visible.length < results.length;
  const reachedEnd = !hasMore && results.length > PAGE_SIZE;

  /**
   * Observe the unobtrusive sentinel directly after the grid. A ref guards
   * against repeated observer entries while the next batch is being staged;
   * the timer gives the small loading treatment enough time to be perceived.
   */
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (
      booting ||
      catalogueLoading ||
      !isObserverReady ||
      !hasMore ||
      !sentinel ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || loadingRef.current) return;

        loadingRef.current = true;
        setIsLoadingMore(true);

        loadTimerRef.current = window.setTimeout(() => {
          setVisibleCount((current) => Math.min(current + PAGE_SIZE, results.length));
          loadingRef.current = false;
          setIsLoadingMore(false);
          loadTimerRef.current = null;
        }, LOAD_DELAY);
      },
      {
        /* Starts loading just before the shopper reaches the physical end. */
        rootMargin: '240px 0px',
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [booting, catalogueLoading, hasMore, isObserverReady, results.length]);

  /* Chips describing what is currently applied. */
  const chips = [
    ...(filters.q ? [{ label: `"${filters.q}"`, remove: () => writeFilters({ ...filters, q: '' }) }] : []),
    ...(filters.tag
      ? [
          {
            label: TAG_LABELS[filters.tag] || filters.tag,
            remove: () => writeFilters({ ...filters, tag: '' }),
          },
        ]
      : []),
    ...filters.genders.map((gender) => ({
      label: gender,
      remove: () =>
        writeFilters({ ...filters, genders: filters.genders.filter((g) => g !== gender) }),
    })),
    ...filters.categories.map((category) => ({
      label: category,
      remove: () =>
        writeFilters({
          ...filters,
          categories: filters.categories.filter((c) => c !== category),
        }),
    })),
    ...filters.sizes.map((size) => ({
      label: `Size ${size}`,
      remove: () => writeFilters({ ...filters, sizes: filters.sizes.filter((s) => s !== size) }),
    })),
    ...filters.priceBands.map((id) => ({
      label: PRICE_BANDS.find((band) => band.id === id)?.label || id,
      remove: () =>
        writeFilters({ ...filters, priceBands: filters.priceBands.filter((b) => b !== id) }),
    })),
    ...(filters.onSale
      ? [{ label: 'On sale', remove: () => writeFilters({ ...filters, onSale: false }) }]
      : []),
  ];

  /* Page copy adapts to the active view. */
  const heading = (() => {
    if (filters.q) return `Results for "${filters.q}"`;
    if (filters.tag) return TAG_LABELS[filters.tag] || 'Shop';
    if (filters.genders.length === 1 && filters.categories.length === 0)
      return `${filters.genders[0]}'s Collection`;
    if (filters.categories.length === 1) return filters.categories[0];
    return 'All Collections';
  })();

  const metaTitle = (() => {
    if (filters.genders.length === 1) return `Shop ${filters.genders[0]}'s Fashion`;
    if (filters.tag === 'new') return 'New Arrivals';
    if (filters.tag === 'sale') return 'Sale';
    return 'Shop All';
  })();

  const filterPanel = (
    <ProductFilters
      filters={filters}
      onChange={(next) => writeFilters(next)}
      onClear={clearAll}
      counts={counts}
      categories={catalogueCategories}
      genders={GENDERS}
    />
  );

  return (
    <>
      <PageMeta
        title={metaTitle}
        description={`Browse ${products.length} curated pieces from VERA. Filter by category, size, price and offers, with easy 15 day returns across India.`}
      />

      {/* Page header */}
      <div className="border-b border-line bg-sand/40">
        <div className="shell py-10 lg:py-14">
          <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Shop' }]} />
          <h1 className="mt-5 text-[2.4rem] leading-none sm:text-[3.2rem]">{heading}</h1>
          <p className="mt-3 text-sm text-slate">
            {pluralise(results.length, 'piece')} available
            {filters.genders.length === 0 && filters.categories.length === 0 && !filters.tag
              ? ' across women, men and accessories'
              : ''}
          </p>
        </div>
      </div>

      <div className="shell py-10 lg:py-14">
        <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-12 xl:grid-cols-[17rem_1fr]">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-28">{filterPanel}</div>
          </aside>

          <div className="min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="inline-flex items-center gap-2.5 border border-ink/20 px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] text-ink transition-colors hover:border-ink lg:hidden"
              >
                <Funnel size={14} strokeWidth={1.5} />
                Filters
                {activeCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center bg-clay px-1 text-[9px] text-cream">
                    {activeCount}
                  </span>
                )}
              </button>

              <p className="hidden text-xs text-muted lg:block">
                Showing {visible.length} of {results.length}
              </p>

              <label className="flex items-center gap-2.5 text-[10px] uppercase tracking-[0.18em] text-muted">
                <span className="hidden sm:inline">Sort</span>
                <select
                  value={sort}
                  onChange={(event) => writeFilters(filters, event.target.value)}
                  className="border border-line bg-white px-3 py-2.5 text-[11px] normal-case tracking-normal text-ink outline-none transition-colors hover:border-ink/50 focus:border-ink"
                  aria-label="Sort products"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Active chips */}
            {chips.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {chips.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={chip.remove}
                    className="group inline-flex items-center gap-2 border border-line bg-white px-3 py-1.5 text-xs text-slate transition-colors hover:border-ink hover:text-ink"
                  >
                    {chip.label}
                    <X size={12} strokeWidth={1.7} className="text-muted group-hover:text-ink" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={clearAll}
                  className="ml-1 text-[10px] uppercase tracking-[0.18em] text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Grid */}
            <div className="mt-8">
              {booting || catalogueLoading ? (
                <ProductGrid loading skeletonCount={8} />
              ) : results.length === 0 ? (
                <EmptyState
                  icon={Funnel}
                  title="No styles found."
                  description="Nothing matches this combination yet. Try removing a filter or two, or browse the full collection."
                >
                  <Button onClick={clearAll}>Clear filters</Button>
                  <Button to="/shop" variant="outline">
                    View all
                  </Button>
                </EmptyState>
              ) : (
                <>
                  <ProductGrid
                    products={visible}
                    columns="four"
                    prioritiseFirst={4}
                    onQuickView={(product) => openQuickView(product)}
                  />

                  {hasMore && (
                    <div
                      ref={sentinelRef}
                      data-testid="infinite-scroll-sentinel"
                      aria-hidden="true"
                      className="flex h-16 items-center justify-center"
                    >
                      {isLoadingMore && (
                        <div className="flex items-center gap-2.5 text-xs text-muted">
                          <span className="h-4 w-4 animate-spin rounded-full border border-line border-t-ink" />
                          <span>Loading more styles...</span>
                        </div>
                      )}
                    </div>
                  )}

                  {reachedEnd && (
                    <p className="mt-14 text-center text-xs text-muted">You've reached the end.</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile filters */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Filters"
        side="left"
        widthClass="max-w-[22rem]"
        footer={
          <div className="flex gap-2.5 px-5 py-4">
            <Button variant="outline" full onClick={clearAll}>
              Clear all
            </Button>
            <Button full onClick={() => setDrawerOpen(false)}>
              Apply filters ({results.length})
            </Button>
          </div>
        }
      >
        <div className="px-5 py-5">{filterPanel}</div>
      </Drawer>
    </>
  );
}
