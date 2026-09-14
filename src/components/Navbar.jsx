import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Heart, Menu, Search, ShoppingBag, X } from 'lucide-react';
import { store } from '../config/store';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useUI } from '../context/UIContext';
import useFocusTrap from '../hooks/useFocusTrap';
import useScrollLock from '../hooks/useScrollLock';
import { cx } from '../utils/format';

const NAV_LINKS = [
  { label: 'Home', to: '/' }, { label: 'Shop', to: '/shop' }, { label: 'Women', to: '/shop?gender=Women' }, { label: 'Men', to: '/shop?gender=Men' }, { label: 'New Arrivals', to: '/shop?tag=new' }, { label: 'About', to: '/about' },
];
const MOBILE_EXTRA_LINKS = [
  { label: 'Best Sellers', to: '/shop?tag=bestseller' }, { label: 'Sale', to: '/shop?tag=sale' }, { label: 'Wishlist', to: '/wishlist' }, { label: 'Contact', to: '/contact' },
];

function IconButton({ label, onClick, to, children, badge }) {
  const content = <>{children}{badge > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-[17px] min-w-[17px] items-center justify-center bg-clay px-1 text-[9px] font-normal tabular-nums text-cream">{badge > 99 ? '99+' : badge}</span>}<span className="sr-only">{label}</span></>;
  const className = 'relative flex h-10 w-10 items-center justify-center text-ink transition-colors duration-200 hover:text-clay';
  return to ? <Link to={to} className={className} aria-label={label}>{content}</Link> : <button type="button" onClick={onClick} className={className} aria-label={label}>{content}</button>;
}

/** Sticky header with a keyboard-safe mobile navigation panel. */
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalItems } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { openSearch, openCart } = useUI();
  const location = useLocation();
  const menuPanelRef = useRef(null);
  const menuCloseRef = useRef(null);
  const menuId = useId();
  const closeMobileMenu = useCallback(() => setMobileOpen(false), []);

  useScrollLock(mobileOpen);
  useFocusTrap(mobileOpen, menuPanelRef, { initialFocusRef: menuCloseRef, onEscape: closeMobileMenu });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => { closeMobileMenu(); }, [location.pathname, location.search, closeMobileMenu]);

  const isActive = (to) => {
    const [path, query] = to.split('?');
    if (path !== location.pathname) return false;
    return !query ? location.search === '' || path !== '/shop' : location.search.includes(query);
  };

  return <>
    <div className="bg-ink text-cream"><div className="shell flex h-9 items-center justify-center overflow-hidden"><p className="truncate text-[10px] uppercase tracking-[0.22em] text-cream/85">{store.announcements[0]}</p></div></div>
    <header className={cx('sticky top-0 z-50 border-b transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]', scrolled ? 'border-line bg-cream/92 backdrop-blur-md' : 'border-transparent bg-cream')}>
      <div className="shell"><div className={cx('relative flex items-center justify-between transition-all duration-300', scrolled ? 'h-16' : 'h-20 lg:h-24')}>
        <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open menu" aria-expanded={mobileOpen} aria-controls={menuId} className="-ml-2 flex h-10 w-10 items-center justify-center text-ink lg:hidden"><Menu size={20} strokeWidth={1.4} /></button>
        <nav aria-label="Primary" className="hidden lg:flex lg:flex-1 lg:items-center lg:gap-8">{NAV_LINKS.map((link) => <NavLink key={link.label} to={link.to} data-active={isActive(link.to)} className="link-underline text-[11px] font-normal uppercase tracking-[0.2em] text-ink transition-colors hover:text-clay">{link.label}</NavLink>)}</nav>
        <Link to="/" aria-label={`${store.storeNamePlain} home`} className="absolute left-1/2 -translate-x-1/2 lg:static lg:left-auto lg:translate-x-0"><span className={cx('block font-sans font-medium leading-none text-ink transition-all duration-300', scrolled ? 'text-[1.15rem]' : 'text-[1.35rem] lg:text-[1.6rem]')} style={{ letterSpacing: '0.3em' }}>{store.storeName}</span></Link>
        <div className="flex flex-1 items-center justify-end gap-0.5 sm:gap-1"><IconButton label="Search" onClick={openSearch}><Search size={19} strokeWidth={1.4} /></IconButton><span className="hidden sm:block"><IconButton label="Wishlist" to="/wishlist" badge={wishlistCount}><Heart size={19} strokeWidth={1.4} /></IconButton></span><IconButton label="Open bag" onClick={openCart} badge={totalItems}><ShoppingBag size={19} strokeWidth={1.4} /></IconButton></div>
      </div></div>
    </header>

    {mobileOpen && <div className="fixed inset-0 z-[96] lg:hidden">
      <button type="button" aria-label="Close menu" onClick={closeMobileMenu} className="absolute inset-0 animate-fade-in cursor-default bg-ink/40 backdrop-blur-[2px]" />
      <nav ref={menuPanelRef} id={menuId} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Mobile navigation" className="absolute inset-y-0 left-0 flex w-[min(21rem,88vw)] animate-slide-in-left flex-col bg-cream shadow-panel outline-none">
        <div className="flex items-center justify-between border-b border-line px-5 py-5"><span className="font-sans text-lg font-medium text-ink" style={{ letterSpacing: '0.3em' }}>{store.storeName}</span><button ref={menuCloseRef} type="button" onClick={closeMobileMenu} aria-label="Close menu" className="flex h-9 w-9 items-center justify-center text-ink"><X size={19} strokeWidth={1.4} /></button></div>
        <div className="flex-1 overflow-y-auto px-5 py-7"><ul className="space-y-1">{NAV_LINKS.map((link) => <li key={link.label}><Link to={link.to} className="block py-3 font-display text-2xl text-ink transition-colors hover:text-clay">{link.label}</Link></li>)}</ul><div className="mt-8 border-t border-line pt-6"><p className="eyebrow mb-4">More</p><ul className="space-y-3">{MOBILE_EXTRA_LINKS.map((link) => <li key={link.label}><Link to={link.to} className="text-sm text-slate transition-colors hover:text-ink">{link.label}</Link></li>)}</ul></div></div>
        <div className="border-t border-line px-5 py-5 text-xs text-muted"><p>{store.phone}</p><p className="mt-1">{store.email}</p></div>
      </nav>
    </div>}
  </>;
}
