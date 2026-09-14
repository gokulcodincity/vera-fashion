import { createClient } from '@supabase/supabase-js';
import { loadEnv } from 'vite';
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';

const env = loadEnv('', process.cwd(), 'VITE_');
const verify = Object.fromEntries(readFileSync('.env.verify', 'utf8').split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#') && line.includes('=')).map((line) => {
  const index = line.indexOf('=');
  return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
}));
const failures = [];
const passes = [];
const pass = (message) => { passes.push(message); console.log(`PASS: ${message}`); };
const fail = (message) => failures.push(message);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY || !verify.VERA_TEST_ADMIN_EMAIL || !verify.VERA_TEST_ADMIN_PASSWORD) {
  console.log('FAIL: Required live configuration or disposable credentials are unavailable.');
  process.exit(1);
}

const admin = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const publicClient = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const stamp = `${Date.now()}`;
const slug = `verification-garment-${stamp}`;
const originalName = `Verification Garment ${stamp}`;
const editedName = `${originalName} Updated`;
const sku = `VERA-VERIFY-${stamp}`;
let productId;
let variantId;
let orderId;
let bannerId;
let storagePath;
let browser;
let page;

async function getVariantStock() {
  const { data, error } = await admin.from('product_variants').select('stock_quantity').eq('id', variantId).single();
  if (error) throw error;
  return data.stock_quantity;
}

async function poll(assertion, timeout = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await assertion()) return true;
    await wait(250);
  }
  return false;
}

try {
  const { data: signIn, error: signInError } = await admin.auth.signInWithPassword({ email: verify.VERA_TEST_ADMIN_EMAIL, password: verify.VERA_TEST_ADMIN_PASSWORD });
  if (signInError || !signIn.user) throw new Error('Disposable admin sign-in failed.');
  const { data: profile, error: profileError } = await admin.from('profiles').select('role').eq('id', signIn.user.id).single();
  if (profileError || !['admin', 'staff'].includes(profile?.role)) throw new Error('Disposable account does not have an admin or staff profile role.');
  pass('disposable admin account authenticates through Supabase Auth and has an authorized profile role');

  const { error: anonInsertError } = await publicClient.from('products').insert({
    name: `Denied Verification ${stamp}`, slug: `denied-verification-${stamp}`, description: 'Denied anonymous mutation probe.', gender: 'Unisex', base_price: 1,
  });
  if (anonInsertError) pass('anonymous RLS denies direct product creation');
  else fail('anonymous product creation unexpectedly succeeded');

  const { data: category, error: categoryError } = await admin.from('categories').select('id,name').eq('is_active', true).order('sort_order').limit(1).single();
  if (categoryError) throw categoryError;
  const { data: product, error: productError } = await admin.from('products').insert({
    name: originalName, slug, description: 'Disposable verification product. This record is removed after testing.', category_id: category.id, gender: 'Women', base_price: 1500, original_price: 1700, sale_price: 1234,
    highlights: [], details: {}, is_active: true, is_new: false, is_best_seller: false, is_featured: false,
  }).select().single();
  if (productError) throw productError;
  productId = product.id;
  pass('admin RLS permits product creation');

  const { data: variant, error: variantError } = await admin.from('product_variants').insert({
    product_id: productId, sku, size: 'M', color: 'Verification Blue', color_hex: '#1E3A8A', stock_quantity: 5, is_active: true,
  }).select().single();
  if (variantError) throw variantError;
  variantId = variant.id;
  pass('admin RLS permits size/color variant creation with initial stock');

  const { error: negativeStockError } = await admin.from('product_variants').update({ stock_quantity: -1 }).eq('id', variantId);
  if (negativeStockError) pass('database stock constraint rejects negative inventory');
  else fail('database accepted negative variant stock');

  browser = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--no-sandbox', '--hide-scrollbars'] });
  page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:5173/admin/login', { waitUntil: 'networkidle2' });
  await page.locator('input[type="email"]').fill(verify.VERA_TEST_ADMIN_EMAIL);
  await page.locator('input[type="password"]').fill(verify.VERA_TEST_ADMIN_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForFunction(() => location.pathname === '/admin', { timeout: 15000 });
  pass('admin login UI establishes an authorized protected dashboard session');

  await page.goto('http://127.0.0.1:5173/admin/products', { waitUntil: 'networkidle2' });
  await page.waitForFunction((name) => document.body.innerText.includes(name), {}, originalName);
  pass('protected Admin Products page reads the newly created product through admin RLS');

  await page.goto(`http://127.0.0.1:5173/admin/products/${productId}/edit`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('form input');
  await page.locator(`input[value="${originalName}"]`).fill(editedName);
  await page.evaluate(() => [...document.querySelectorAll('button')].find((button) => button.textContent.trim() === 'Save product')?.click());
  if (!await poll(async () => {
    const { data } = await admin.from('products').select('name').eq('id', productId).single();
    return data?.name === editedName;
  })) throw new Error('Admin product editor did not persist the edited name.');
  pass('admin product editor updates product data');

  const imageInput = await page.$('input[type="file"]');
  if (!imageInput) throw new Error('Admin product-image upload input is unavailable.');
  await imageInput.uploadFile('d:\\web\\.imgcheck\\t1.jpg');
  if (!await poll(async () => {
    const { data } = await admin.from('product_images').select('storage_path,image_url').eq('product_id', productId);
    if (data?.[0]?.storage_path) storagePath = data[0].storage_path;
    return Boolean(storagePath && data[0].image_url);
  })) throw new Error('Admin product-image upload did not create a storage-backed image record.');
  pass('admin product editor uploads a JPEG to secured Products Storage and saves its image record');

  await admin.from('product_variants').update({ stock_quantity: 0 }).eq('id', variantId).throwOnError();
  await page.goto(`http://127.0.0.1:5173/product/${slug}`, { waitUntil: 'networkidle2' });
  await page.waitForFunction((name) => document.title.includes(name), {}, editedName);
  const outOfStock = await page.evaluate(() => [...document.querySelectorAll('button')].some((button) => button.textContent.trim() === 'Out of Stock' && button.disabled));
  if (outOfStock) pass('stock set to zero renders a disabled Out of Stock storefront control');
  else fail('stock set to zero did not render a disabled Out of Stock storefront control');

  await admin.from('product_variants').update({ stock_quantity: 5 }).eq('id', variantId).throwOnError();
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForFunction((name) => document.title.includes(name), {}, editedName);
  const purchasable = await page.evaluate(() => [...document.querySelectorAll('button')].some((button) => button.textContent.trim() === 'Add to Cart' && !button.disabled));
  if (purchasable) pass('restocked variant becomes purchasable in the storefront');
  else fail('restocked variant did not become purchasable in the storefront');

  const customer = { name: 'Verification User', email: 'verification@example.invalid', phone: '9876543210', address_line1: '123 Verification Street', address_line2: '', city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' };
  const { data: order, error: orderError } = await publicClient.rpc('create_order', { p_customer: customer, p_items: [{ variant_id: variantId, quantity: 2 }], p_payment_method: 'cod' });
  if (orderError || !order?.order_id) throw new Error('Transactional create_order RPC did not create the verification order.');
  orderId = order.order_id;
  if (Number(order.subtotal) === 2468) pass('create_order reprices from the database sale price instead of a client-supplied value');
  else fail(`create_order returned an unexpected authoritative subtotal: ${order.subtotal}`);
  if (await getVariantStock() === 3) pass('successful create_order atomically deducts requested inventory');
  else fail('successful create_order did not deduct the expected inventory');

  const { data: orderRow, error: orderReadError } = await admin.from('orders').select('id,order_number,order_status,order_items(unit_price,quantity,variant_id)').eq('id', orderId).single();
  if (orderReadError || orderRow?.order_items?.[0]?.variant_id !== variantId || Number(orderRow.order_items[0].unit_price) !== 1234) fail('admin order query did not return the expected immutable verification order item');
  else pass('Admin Orders authorization exposes the created order and immutable database-priced order item');

  await page.goto('http://127.0.0.1:5173/admin/orders', { waitUntil: 'networkidle2' });
  const orderVisible = await poll(async () => page.evaluate((number) => document.body.innerText.includes(number), order.order_number));
  if (orderVisible) pass('Admin Orders UI displays the created verification order');
  else fail('Admin Orders UI did not display the created verification order');

  const { data: cancelled, error: cancelError } = await admin.rpc('set_order_status', { p_order_id: orderId, p_status: 'cancelled' });
  if (cancelError || cancelled?.order_status !== 'cancelled') throw new Error('Admin cancellation RPC failed.');
  if (await getVariantStock() === 5) pass('first cancellation restores inventory exactly once');
  else fail('first cancellation did not restore inventory');
  const { error: secondCancelError } = await admin.rpc('set_order_status', { p_order_id: orderId, p_status: 'cancelled' });
  if (!secondCancelError && await getVariantStock() === 5) pass('repeat cancellation does not restore inventory twice');
  else fail('repeat cancellation changed inventory or failed unexpectedly');

  await admin.from('products').update({ is_active: false }).eq('id', productId).throwOnError();
  const { data: inactivePublic, error: inactivePublicError } = await publicClient.from('products').select('id').eq('id', productId).maybeSingle();
  if (!inactivePublicError && !inactivePublic) pass('public RLS does not expose a known inactive product');
  else fail('public RLS exposed the known inactive product');
  await admin.from('products').update({ is_active: true }).eq('id', productId).throwOnError();

  const { data: settings, error: settingsError } = await admin.from('store_settings').select('id,tagline').order('updated_at').limit(1).single();
  if (settingsError) throw settingsError;
  const { error: settingsUpdateError } = await admin.from('store_settings').update({ tagline: settings.tagline }).eq('id', settings.id);
  if (settingsUpdateError) fail('admin could not perform an authorized no-op store-settings update');
  else pass('admin RLS permits store-settings management');

  const { data: banner, error: bannerError } = await admin.from('banners').insert({ title: `Verification banner ${stamp}`, image_url: 'https://example.invalid/verification.jpg', is_active: false, sort_order: 999999 }).select().single();
  if (bannerError) throw bannerError;
  bannerId = banner.id;
  const { error: bannerDeleteError } = await admin.from('banners').delete().eq('id', bannerId);
  if (bannerDeleteError) fail('admin could not delete the verification banner');
  else { bannerId = undefined; pass('admin RLS permits banner creation and deletion'); }
} catch (error) {
  fail(`unexpected lifecycle verification error: ${error.message}`);
} finally {
  try {
    if (orderId && variantId && await getVariantStock() < 5) {
      const { error } = await admin.rpc('set_order_status', { p_order_id: orderId, p_status: 'cancelled' });
      if (error) fail(`verification-order cleanup cancellation failed: ${error.message}`);
    }
  } catch (error) { fail(`verification-order cleanup could not determine inventory: ${error.message}`); }
  if (bannerId) await admin.from('banners').delete().eq('id', bannerId);
  if (productId) {
    let storageRemoved = true;
    if (storagePath) {
      const { error: storageRemoveError } = await admin.storage.from('products').remove([storagePath]);
      storageRemoved = !storageRemoveError;
      if (!storageRemoved) fail(`verification Storage API cleanup failed: ${storageRemoveError.message}`);
      else {
        const prefix = storagePath.split('/').slice(0, -1).join('/');
        const removed = await poll(async () => {
          const { data, error } = await admin.storage.from('products').list(prefix);
          return !error && !data?.some((item) => item.name === storagePath.split('/').at(-1));
        });
        if (removed) pass('managed Products Storage object is removed through the authenticated Storage API');
        else fail('Storage API did not remove the managed product object');
      }
    }
    if (storageRemoved) {
      const { error: productDeleteError } = await admin.from('products').delete().eq('id', productId);
      if (productDeleteError) fail(`verification-product cleanup deletion failed: ${productDeleteError.message}`);
      else pass('product deletion succeeds after Storage API cleanup');
    }
  }
  await admin.auth.signOut();
  await browser?.close();
}

if (failures.length) {
  failures.forEach((message) => console.log(`FAIL: ${message}`));
  process.exitCode = 1;
} else {
  console.log('LIVE ADMIN LIFECYCLE VERIFICATION COMPLETED WITHOUT FAILURES');
}
