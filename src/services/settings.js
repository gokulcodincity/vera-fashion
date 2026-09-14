import { requireSupabase } from '../lib/supabase';

export async function getStoreSettings() {
  const { data, error } = await requireSupabase().from('store_settings').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveStoreSettings(values) {
  const { data, error } = await requireSupabase().from('store_settings').upsert(values).select().single();
  if (error) throw error;
  return data;
}

export async function getActiveBanners() {
  const { data, error } = await requireSupabase().from('banners').select('*').eq('is_active', true).order('sort_order');
  if (error) throw error;
  return data || [];
}
