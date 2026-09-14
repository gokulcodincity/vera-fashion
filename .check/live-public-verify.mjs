import { createClient } from '@supabase/supabase-js';
import { loadEnv } from 'vite';

const env = loadEnv('', process.cwd(), 'VITE_');
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;
const failures = [];
const blocked = [];
const pass = (message) => console.log(`PASS: ${message}`);
const fail = (message) => failures.push(message);

if (!url || !key) {
  console.log('FAIL: Required VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is unavailable.');
  process.exit(1);
}

const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const exactCount = async (table) => {
  const { count, error } = await client.from(table).select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
};

try {
  const [categoryCount, productCount, variantCount, settings, banners] = await Promise.all([
    exactCount('categories'),
    exactCount('products'),
    exactCount('product_variants'),
    client.from('store_settings').select('id,store_name,currency').limit(1),
    client.from('banners').select('id,title,is_active').order('sort_order'),
  ]);

  categoryCount === 11
    ? pass('anonymous RLS query returns exactly 11 public categories')
    : fail(`expected 11 public categories, received ${categoryCount}`);
  productCount === 39
    ? pass('anonymous RLS query returns exactly 39 public products')
    : fail(`expected 39 public products, received ${productCount}`);
  variantCount > 0
    ? pass(`anonymous RLS query returns active product variants (${variantCount})`)
    : fail('expected at least one publicly readable active product variant');
  if (settings.error) fail(`public store settings query failed: ${settings.error.message}`);
  else pass('anonymous RLS query can read store settings');
  if (banners.error) fail(`public banners query failed: ${banners.error.message}`);
  else pass('anonymous RLS query can read active banners');

  const { data: sample, error: sampleError } = await client
    .from('products')
    .select('id,name,slug,is_active,categories(name,slug),product_images(id,image_url,sort_order),product_variants(id,sku,size,color,stock_quantity,is_active)')
    .eq('slug', 'amaira-floral-wrap-dress')
    .maybeSingle();
  if (sampleError) fail(`live PDP catalogue query failed: ${sampleError.message}`);
  else if (!sample?.id || !sample.categories || !Array.isArray(sample.product_variants) || sample.product_variants.length === 0) {
    fail('live PDP catalogue query did not return a seeded product with category and variants');
  } else {
    pass('live PDP catalogue query returns category, images, and size/color variants');
    const active = sample.product_variants.filter((variant) => variant.is_active && variant.stock_quantity > 0);
    active.length > 0
      ? pass('seeded PDP has at least one purchasable in-stock variant')
      : fail('seeded PDP has no active in-stock variants');
  }

  const { data: inactiveProducts, error: inactiveError } = await client
    .from('products')
    .select('id', { count: 'exact' })
    .eq('is_active', false);
  if (inactiveError) fail(`inactive-product visibility probe failed: ${inactiveError.message}`);
  else if ((inactiveProducts || []).length === 0) {
    blocked.push('inactive products are absent from the seeded dataset, so policy behavior for a known inactive record cannot be proven without an authenticated admin creating or deactivating a disposable product');
  } else {
    fail('anonymous client received an inactive product, which violates public catalogue RLS');
  }

  const customer = { name: 'Verification User', email: 'verification@example.invalid', phone: '9876543210', address_line1: '123 Verification Street', address_line2: '', city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' };
  const { error: rpcError } = await client.rpc('create_order', { p_customer: customer, p_items: [], p_payment_method: 'cod' });
  if (rpcError?.message?.includes('bag is invalid')) pass('anonymous checkout RPC exists, is callable, and rejects an empty cart without creating an order');
  else fail(`create_order RPC was not safely verified: ${rpcError?.message || 'unexpected successful response'}`);
} catch (error) {
  fail(`unexpected live verification error: ${error.message}`);
}

blocked.forEach((message) => console.log(`BLOCKED: ${message}`));
if (failures.length) {
  failures.forEach((message) => console.log(`FAIL: ${message}`));
  process.exitCode = 1;
} else {
  console.log('LIVE PUBLIC VERIFICATION COMPLETED WITHOUT FAILURES');
}
