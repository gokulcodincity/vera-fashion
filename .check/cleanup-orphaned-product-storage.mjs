import { createClient } from '@supabase/supabase-js';
import { loadEnv } from 'vite';
import { readFileSync } from 'node:fs';

const env = loadEnv('', process.cwd(), 'VITE_');
const verify = Object.fromEntries(readFileSync('.env.verify', 'utf8').split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#') && line.includes('=')).map((line) => { const index = line.indexOf('='); return [line.slice(0, index).trim(), line.slice(index + 1).trim()]; }));
const client = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const { error: signInError } = await client.auth.signInWithPassword({ email: verify.VERA_TEST_ADMIN_EMAIL, password: verify.VERA_TEST_ADMIN_PASSWORD });
if (signInError) throw new Error('Temporary admin authentication failed during orphan cleanup.');
const { data: products, error: productError } = await client.from('products').select('id');
if (productError) throw productError;
const validIds = new Set((products || []).map((product) => product.id));
const { data: roots, error: rootError } = await client.storage.from('products').list('', { limit: 1000 });
if (rootError) throw rootError;
let removed = 0;
for (const root of roots || []) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(root.name) || validIds.has(root.name)) continue;
  const { data: files, error: listError } = await client.storage.from('products').list(root.name, { limit: 1000 });
  if (listError) throw listError;
  const paths = (files || []).filter((file) => file.id).map((file) => `${root.name}/${file.name}`);
  if (!paths.length) continue;
  const { error: removeError } = await client.storage.from('products').remove(paths);
  if (removeError) throw removeError;
  removed += paths.length;
}
console.log(`PASS: removed ${removed} orphaned product Storage object(s)`);
await client.auth.signOut();
