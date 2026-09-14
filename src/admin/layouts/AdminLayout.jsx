import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BarChart3, Box, Image, Layers3, LogOut, Menu, PackageSearch, Settings, ShoppingBag, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cx } from '../../utils/format';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', Icon: BarChart3, end: true },
  { to: '/admin/products', label: 'Products', Icon: ShoppingBag },
  { to: '/admin/categories', label: 'Categories', Icon: Layers3 },
  { to: '/admin/inventory', label: 'Inventory', Icon: PackageSearch },
  { to: '/admin/orders', label: 'Orders', Icon: Box },
  { to: '/admin/banners', label: 'Banners', Icon: Image },
  { to: '/admin/settings', label: 'Store Settings', Icon: Settings },
];

function Sidebar({ close }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const logout = async () => { await signOut(); navigate('/admin/login', { replace: true }); };
  const linkClass = ({ isActive }) => cx('flex items-center gap-3 px-4 py-3 text-sm transition-colors', isActive ? 'bg-ink text-cream' : 'text-slate hover:bg-sand hover:text-ink');
  return <aside className="flex h-full w-72 flex-col border-r border-line bg-cream"><div className="flex h-20 items-center justify-between border-b border-line px-6"><span className="font-sans text-lg font-medium tracking-[0.28em] text-ink">VÉRA</span><button type="button" onClick={close} aria-label="Close admin navigation" className="p-2 lg:hidden"><X size={19} /></button></div><div className="px-4 py-5"><p className="mb-3 px-4 text-[10px] uppercase tracking-[0.2em] text-muted">Store management</p><nav className="space-y-1">{NAV_ITEMS.map(({ to, label, Icon, end }) => <NavLink key={to} to={to} end={end} onClick={close} className={linkClass}><Icon size={17} strokeWidth={1.5} />{label}</NavLink>)}</nav></div><div className="mt-auto border-t border-line p-4"><p className="px-3 text-xs text-slate">{profile?.full_name || 'Store administrator'}</p><button type="button" onClick={logout} className="mt-3 flex w-full items-center gap-3 px-3 py-2.5 text-sm text-slate transition-colors hover:text-clay"><LogOut size={16} />Logout</button></div></aside>;
}

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  return <div className="min-h-screen bg-sand/35 text-ink"><div className="hidden fixed inset-y-0 left-0 z-30 lg:block"><Sidebar /></div>{open && <div className="fixed inset-0 z-[100] lg:hidden"><button type="button" aria-label="Close admin navigation" onClick={() => setOpen(false)} className="absolute inset-0 bg-ink/40" /><div className="relative h-full w-72"><Sidebar close={() => setOpen(false)} /></div></div>}<div className="lg:pl-72"><header className="sticky top-0 z-20 flex h-20 items-center gap-4 border-b border-line bg-cream/95 px-5 backdrop-blur-md lg:px-8"><button type="button" onClick={() => setOpen(true)} aria-label="Open admin navigation" className="p-2 lg:hidden"><Menu size={20} /></button><div><p className="eyebrow">VÉRA</p><p className="mt-1 font-display text-2xl">Store Admin</p></div></header><main className="mx-auto w-full max-w-7xl p-5 sm:p-8"><Outlet /></main></div></div>;
}
