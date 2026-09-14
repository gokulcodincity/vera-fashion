import { AlertTriangle, Boxes, ClipboardList, PackageX } from 'lucide-react';

const CARDS = [
  { label: 'Total products', Icon: Boxes, key: 'products' },
  { label: 'Active products', Icon: ClipboardList, key: 'active' },
  { label: 'Pending orders', Icon: AlertTriangle, key: 'pending' },
  { label: 'Out of stock variants', Icon: PackageX, key: 'outOfStock' },
];

/** Data is loaded through the admin dashboard service once Supabase is configured. */
export default function AdminDashboard() {
  return <div><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Overview</p><h1 className="mt-2 text-4xl">Dashboard</h1></div><p className="text-sm text-slate">Your store at a glance.</p></div><div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{CARDS.map(({ label, Icon }) => <section key={label} className="border border-line bg-cream p-5"><Icon size={19} strokeWidth={1.4} className="text-clay" /><p className="mt-7 text-[10px] uppercase tracking-[0.18em] text-muted">{label}</p><p className="mt-2 font-display text-4xl text-ink">—</p></section>)}</div><div className="mt-8 grid gap-6 lg:grid-cols-2"><section className="border border-line bg-cream p-6"><h2 className="text-2xl">Recent orders</h2><p className="mt-3 text-sm text-slate">Orders will appear here after the first secure checkout.</p></section><section className="border border-line bg-cream p-6"><h2 className="text-2xl">Low stock</h2><p className="mt-3 text-sm text-slate">Variants at or below your low-stock threshold will appear here.</p></section></div></div>;
}
