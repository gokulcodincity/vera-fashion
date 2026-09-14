-- Read-only VÉRA deployment verification.
-- Run in Supabase Dashboard -> SQL Editor as the project owner.

-- 1) Required tables and RLS state.
with expected(table_name) as (
  values ('profiles'), ('categories'), ('products'), ('product_images'),
    ('product_variants'), ('orders'), ('order_items'), ('banners'), ('store_settings')
)
select expected.table_name,
       (c.oid is not null) as table_exists,
       coalesce(c.relrowsecurity, false) as rls_enabled
from expected
left join pg_namespace n on n.nspname = 'public'
left join pg_class c on c.relnamespace = n.oid and c.relname = expected.table_name and c.relkind = 'r'
order by expected.table_name;

-- 2) Required catalogue counts after the seed.
select
  (select count(*) from public.categories) as category_count,
  (select count(*) from public.products) as product_count;

-- 3) Public-schema constraints (including price, stock, slug, status, and FK constraints).
select conrelid::regclass as table_name, conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where connamespace = 'public'::regnamespace
  and conrelid::regclass::text in (
    'profiles', 'categories', 'products', 'product_images', 'product_variants',
    'orders', 'order_items', 'banners', 'store_settings'
  )
order by conrelid::regclass::text, conname;

-- 4) Required public indexes.
select schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('categories', 'products', 'product_images', 'product_variants', 'orders', 'order_items')
order by tablename, indexname;

-- 5) RLS policies for all public commerce tables and secured Storage objects.
select schemaname, tablename, policyname, cmd, qual, with_check
from pg_policies
where (schemaname = 'public' and tablename in (
  'profiles', 'categories', 'products', 'product_images', 'product_variants',
  'orders', 'order_items', 'banners', 'store_settings'
)) or (schemaname = 'storage' and tablename = 'objects')
order by schemaname, tablename, policyname;

-- 6) Storage bucket configuration.
select id, name, public
from storage.buckets
where id in ('products', 'banners')
order by id;

-- 7) Required functions, triggers, and RPC grants.
select
  to_regprocedure('public.create_order(jsonb,jsonb,text)') is not null as create_order_exists,
  to_regprocedure('public.set_order_status(uuid,text)') is not null as set_order_status_exists,
  has_function_privilege('anon', 'public.create_order(jsonb,jsonb,text)', 'EXECUTE') as anon_can_execute_create_order,
  has_function_privilege('authenticated', 'public.set_order_status(uuid,text)', 'EXECUTE') as authenticated_can_execute_set_order_status;

select tgrelid::regclass as table_name, tgname, pg_get_triggerdef(oid) as definition
from pg_trigger
where not tgisinternal
  and tgrelid::regclass::text in ('profiles', 'categories', 'products', 'product_variants', 'orders', 'banners', 'store_settings', 'auth.users')
order by tgrelid::regclass::text, tgname;

-- 8) Confirm the deprecated direct-SQL Storage cleanup triggers are absent after 202609130002.
select tgname
from pg_trigger
where not tgisinternal
  and tgname in ('product_image_storage_cleanup', 'banner_storage_cleanup');
-- Expected: zero rows.
