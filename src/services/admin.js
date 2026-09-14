import { requireSupabase } from '../lib/supabase';
import { mapProduct } from './catalogue';
import { removeImage } from './storage';

export async function adminProducts() {
  const { data, error } = await requireSupabase().from('products').select('*,categories(name,slug),product_images(*),product_variants(*)').order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapProduct);
}
export async function adminProduct(id) {
  const { data, error } = await requireSupabase().from('products').select('*,categories(name,slug),product_images(*),product_variants(*)').eq('id', id).single();
  if (error) throw error;
  return data;
}
export async function saveProduct(values) {
  const { id, name, slug, description, category_id, gender, base_price, original_price, sale_price, highlights, details, is_active, is_new, is_best_seller, is_featured } = values;
  const payload = {
    name, slug, description, category_id, gender,
    base_price: Number(base_price), original_price: original_price ? Number(original_price) : null, sale_price: sale_price ? Number(sale_price) : null,
    highlights: highlights || [], details: details || {},
    is_active: Boolean(is_active), is_new: Boolean(is_new), is_best_seller: Boolean(is_best_seller), is_featured: Boolean(is_featured),
  };
  const query = id ? requireSupabase().from('products').update(payload).eq('id', id) : requireSupabase().from('products').insert(payload);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}
export async function removeProduct(id) {
  const client = requireSupabase();
  const { data: images, error: imageError } = await client.from('product_images').select('storage_path').eq('product_id', id);
  if (imageError) throw imageError;
  for (const image of images || []) await removeImage('products', image.storage_path);
  const { error } = await client.from('products').delete().eq('id', id);
  if (error) throw error;
}
export async function saveVariants(productId, variants) {
  const client = requireSupabase();
  const retainedIds = new Set(variants.map((variant) => variant.id).filter(Boolean));
  const { data: existing, error: existingError } = await client.from('product_variants').select('id').eq('product_id', productId);
  if (existingError) throw existingError;
  const staleIds = (existing || []).map((variant) => variant.id).filter((id) => !retainedIds.has(id));
  if (staleIds.length) {
    const { error: deleteError } = await client.from('product_variants').delete().in('id', staleIds);
    if (deleteError) throw deleteError;
  }
  const payload = variants.map(({ id, sku, size, color, color_hex, stock_quantity, is_active }) => ({
    ...(id ? { id } : {}), product_id: productId, sku, size, color, color_hex: color_hex || null,
    stock_quantity: Number(stock_quantity || 0), is_active: Boolean(is_active),
  }));
  if (!payload.length) return [];
  const { data, error } = await client.from('product_variants').upsert(payload).select();
  if (error) throw error;
  return data;
}
export async function adminCategories() { const { data, error } = await requireSupabase().from('categories').select('*, products(count)').order('sort_order').order('name'); if (error) throw error; return data || []; }
export async function saveCategory(values) { const query = values.id ? requireSupabase().from('categories').update(values).eq('id', values.id) : requireSupabase().from('categories').insert(values); const { data, error } = await query.select().single(); if (error) throw error; return data; }
export async function deleteCategory(id) { const { error } = await requireSupabase().from('categories').delete().eq('id', id); if (error) throw error; }
export async function adminInventory() { const { data, error } = await requireSupabase().from('product_variants').select('*,products(name,slug)').order('stock_quantity').limit(500); if (error) throw error; return data || []; }
export async function updateStock(id, stock_quantity) { const { data, error } = await requireSupabase().from('product_variants').update({ stock_quantity: Number(stock_quantity) }).eq('id', id).select().single(); if (error) throw error; return data; }
export async function adminBanners() { const { data, error } = await requireSupabase().from('banners').select('*').order('sort_order'); if (error) throw error; return data || []; }
export async function saveBanner(values) { const query = values.id ? requireSupabase().from('banners').update(values).eq('id', values.id) : requireSupabase().from('banners').insert(values); const { data, error } = await query.select().single(); if (error) throw error; return data; }
export async function deleteBanner(id) {
  const client = requireSupabase();
  const { data: banner, error: bannerError } = await client.from('banners').select('storage_path').eq('id', id).single();
  if (bannerError) throw bannerError;
  await removeImage('banners', banner.storage_path);
  const { error } = await client.from('banners').delete().eq('id', id);
  if (error) throw error;
}
