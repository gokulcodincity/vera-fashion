import { requireSupabase } from '../lib/supabase';

const throwIfError = (result) => {
  if (result.error) throw result.error;
  return result;
};

/** Reads the secure, administrator-only data displayed on the Admin Dashboard. */
export async function getAdminDashboard() {
  const client = requireSupabase();
  const [products, activeProducts, pendingOrders, outOfStockVariants, recentOrders, lowStockVariants] = await Promise.all([
    client.from('products').select('id', { count: 'exact', head: true }),
    client.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
    client.from('orders').select('id', { count: 'exact', head: true }).eq('order_status', 'pending'),
    client.from('product_variants').select('id', { count: 'exact', head: true }).eq('stock_quantity', 0),
    client.from('orders').select('id,order_number,customer_name,order_status,total,created_at').order('created_at', { ascending: false }).limit(5),
    client.from('product_variants').select('id,sku,size,color,stock_quantity,products(name,slug)').gt('stock_quantity', 0).lte('stock_quantity', 5).order('stock_quantity', { ascending: true }).limit(5),
  ]);

  [products, activeProducts, pendingOrders, outOfStockVariants, recentOrders, lowStockVariants].forEach(throwIfError);

  return {
    metrics: {
      products: products.count || 0,
      active: activeProducts.count || 0,
      pending: pendingOrders.count || 0,
      outOfStock: outOfStockVariants.count || 0,
    },
    recentOrders: recentOrders.data || [],
    lowStockVariants: lowStockVariants.data || [],
  };
}
