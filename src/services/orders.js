import { requireSupabase } from '../lib/supabase';

export async function createOrder(customer, items) {
  const payload = items.map((item) => ({ variant_id: item.variantId, quantity: item.quantity }));
  const { data, error } = await requireSupabase().rpc('create_order', {
    p_customer: customer,
    p_items: payload,
    p_payment_method: 'cod',
  });
  if (error) throw error;
  return data;
}

export async function getAdminOrders({ status, limit = 100 } = {}) {
  let query = requireSupabase().from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(limit);
  if (status) query = query.eq('order_status', status);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function setOrderStatus(id, status) {
  const { data, error } = await requireSupabase().rpc('set_order_status', { p_order_id: id, p_status: status });
  if (error) throw error;
  return data;
}
