import { useEffect, useState } from 'react';
import { AlertTriangle, Boxes, ClipboardList, PackageX } from 'lucide-react';
import { getAdminDashboard } from '../../services/dashboard';
import { userMessage } from '../../services/errors';
import { formatPrice } from '../../utils/format';

const CARDS = [
  { label: 'Total products', Icon: Boxes, key: 'products' },
  { label: 'Active products', Icon: ClipboardList, key: 'active' },
  { label: 'Pending orders', Icon: AlertTriangle, key: 'pending' },
  { label: 'Out of stock variants', Icon: PackageX, key: 'outOfStock' },
];

/** Displays secure administrator-only catalogue, order, and inventory summaries. */
export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getAdminDashboard()
      .then((data) => { if (active) setDashboard(data); })
      .catch((loadError) => { if (active) setError(userMessage(loadError, 'Could not load dashboard data.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const recentOrders = dashboard?.recentOrders || [];
  const lowStockVariants = dashboard?.lowStockVariants || [];

  return <div><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Overview</p><h1 className="mt-2 text-4xl">Dashboard</h1></div><p className="text-sm text-slate">Your store at a glance.</p></div>{error && <p role="alert" className="mt-4 text-sm text-clay">{error}</p>}<div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{CARDS.map(({ label, Icon, key }) => <section key={label} className="border border-line bg-cream p-5"><Icon size={19} strokeWidth={1.4} className="text-clay" /><p className="mt-7 text-[10px] uppercase tracking-[0.18em] text-muted">{label}</p><p className="mt-2 font-display text-4xl text-ink">{loading ? '…' : dashboard?.metrics[key] ?? '—'}</p></section>)}</div><div className="mt-8 grid gap-6 lg:grid-cols-2"><section className="border border-line bg-cream p-6"><h2 className="text-2xl">Recent orders</h2>{loading ? <p className="mt-3 text-sm text-slate">Loading recent orders…</p> : recentOrders.length ? <ul className="mt-4 divide-y divide-line">{recentOrders.map((order) => <li key={order.id} className="flex items-center justify-between gap-4 py-3 text-sm"><div><p className="font-medium text-ink">{order.order_number}</p><p className="mt-1 text-xs text-muted">{order.customer_name} · {order.order_status}</p></div><p className="text-ink">{formatPrice(order.total)}</p></li>)}</ul> : <p className="mt-3 text-sm text-slate">No orders yet.</p>}</section><section className="border border-line bg-cream p-6"><h2 className="text-2xl">Low stock</h2>{loading ? <p className="mt-3 text-sm text-slate">Loading stock levels…</p> : lowStockVariants.length ? <ul className="mt-4 divide-y divide-line">{lowStockVariants.map((variant) => <li key={variant.id} className="flex items-center justify-between gap-4 py-3 text-sm"><div><p className="font-medium text-ink">{variant.products?.name}</p><p className="mt-1 text-xs text-muted">{variant.sku} · {variant.color} · {variant.size}</p></div><p className="text-clay">{variant.stock_quantity} left</p></li>)}</ul> : <p className="mt-3 text-sm text-slate">No low-stock variants.</p>}</section></div></div>;
}
