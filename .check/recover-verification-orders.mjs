import { createClient } from '@supabase/supabase-js';
import { loadEnv } from 'vite';
import { readFileSync } from 'node:fs';

const env = loadEnv('', process.cwd(), 'VITE_');
const verify = Object.fromEntries(readFileSync('.env.verify', 'utf8').split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#') && line.includes('=')).map((line) => { const index = line.indexOf('='); return [line.slice(0, index).trim(), line.slice(index + 1).trim()]; }));
const client = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const { error: signInError } = await client.auth.signInWithPassword({ email: verify.VERA_TEST_ADMIN_EMAIL, password: verify.VERA_TEST_ADMIN_PASSWORD });
if (signInError) throw new Error('Temporary admin authentication failed during order recovery.');
const { data: orders, error: orderError } = await client.from('orders').select('id').eq('customer_email', 'verification@example.invalid').neq('order_status', 'cancelled');
if (orderError) throw orderError;
for (const order of orders || []) {
  const { error } = await client.rpc('set_order_status', { p_order_id: order.id, p_status: 'cancelled' });
  if (error) throw error;
}
console.log(`PASS: cancelled ${(orders || []).length} outstanding verification order(s)`);
await client.auth.signOut();
