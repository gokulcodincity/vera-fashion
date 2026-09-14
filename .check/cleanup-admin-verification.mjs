import { createClient } from '@supabase/supabase-js';
import { loadEnv } from 'vite';
import { readFileSync } from 'node:fs';

const env = loadEnv('', process.cwd(), 'VITE_');
const verify = Object.fromEntries(readFileSync('.env.verify', 'utf8').split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#') && line.includes('=')).map((line) => { const index = line.indexOf('='); return [line.slice(0, index).trim(), line.slice(index + 1).trim()]; }));
const client = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const { error: signInError } = await client.auth.signInWithPassword({ email: verify.VERA_TEST_ADMIN_EMAIL, password: verify.VERA_TEST_ADMIN_PASSWORD });
if (signInError) throw new Error('Temporary admin authentication failed during cleanup.');
const { data: products, error: listError } = await client.from('products').select('id').like('slug', 'verification-garment-%');
if (listError) throw listError;
for (const product of products || []) {
  const { data: images, error: imageError } = await client.from('product_images').select('storage_path').eq('product_id', product.id);
  if (imageError) throw imageError;
  const paths = (images || []).map((image) => image.storage_path).filter(Boolean);
  if (paths.length) {
    const { error: storageError } = await client.storage.from('products').remove(paths);
    if (storageError) throw storageError;
  }
  const { error } = await client.from('products').delete().eq('id', product.id);
  if (error) throw error;
}
console.log(`PASS: removed ${(products || []).length} verification product(s) and their managed Storage objects`);
await client.auth.signOut();
