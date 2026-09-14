-- VÉRA commerce foundation. Run with `supabase db push` or the Supabase SQL editor.
-- This migration intentionally grants no client service-role access. Browser access is governed by RLS.

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'customer' check (role in ('customer', 'admin', 'staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 240),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '',
  category_id uuid references public.categories(id) on delete restrict,
  gender text not null default 'Unisex' check (gender in ('Women', 'Men', 'Unisex')),
  base_price numeric(12,2) not null check (base_price >= 0),
  original_price numeric(12,2) check (original_price is null or original_price >= base_price),
  sale_price numeric(12,2) check (sale_price is null or (sale_price >= 0 and sale_price <= base_price)),
  highlights jsonb not null default '[]'::jsonb check (jsonb_typeof(highlights) = 'array'),
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  rating numeric(2,1) not null default 0 check (rating between 0 and 5),
  review_count integer not null default 0 check (review_count >= 0),
  is_active boolean not null default true,
  is_new boolean not null default false,
  is_best_seller boolean not null default false,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text,
  image_url text,
  alt_text text not null default '',
  sort_order integer not null default 0 check (sort_order >= 0),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  constraint product_image_source check (storage_path is not null or image_url is not null),
  unique(product_id, sort_order)
);
create unique index product_images_one_primary_per_product on public.product_images(product_id) where is_primary;

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique check (char_length(trim(sku)) between 1 and 100),
  size text not null default 'One Size' check (char_length(trim(size)) between 1 and 50),
  color text not null default 'Default' check (char_length(trim(color)) between 1 and 80),
  color_hex text check (color_hex is null or color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_id, size, color)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  pincode text not null check (pincode ~ '^[0-9]{6}$'),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  delivery_charge numeric(12,2) not null default 0 check (delivery_charge >= 0),
  total numeric(12,2) not null check (total >= 0),
  payment_method text not null default 'cod' check (payment_method in ('cod')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  order_status text not null default 'pending' check (order_status in ('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  sku text not null,
  size text not null,
  color text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  total_price numeric(12,2) not null check (total_price >= 0),
  created_at timestamptz not null default now(),
  constraint order_item_total_matches_quantity check (total_price = round(unit_price * quantity, 2))
);

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text,
  storage_path text,
  button_text text,
  button_link text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint banner_image_source check (storage_path is not null or image_url is not null)
);

create table public.store_settings (
  id uuid primary key default gen_random_uuid(),
  store_name text not null default 'VÉRA',
  tagline text,
  phone text,
  whatsapp text,
  email text,
  address text,
  instagram text,
  facebook text,
  opening_hours jsonb not null default '[]'::jsonb check (jsonb_typeof(opening_hours) = 'array'),
  currency text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  free_shipping_threshold numeric(12,2) not null default 1999 check (free_shipping_threshold >= 0),
  delivery_fee numeric(12,2) not null default 99 check (delivery_fee >= 0),
  cod_fee numeric(12,2) not null default 49 check (cod_fee >= 0),
  return_window_days integer not null default 15 check (return_window_days >= 0),
  updated_at timestamptz not null default now()
);

create index products_public_catalogue_idx on public.products(is_active, category_id, gender, created_at desc);
create index products_slug_idx on public.products(slug);
create index categories_active_sort_idx on public.categories(is_active, sort_order, name);
create index product_variants_product_stock_idx on public.product_variants(product_id, is_active, stock_quantity);
create index product_variants_sku_idx on public.product_variants(sku);
create index product_images_product_sort_idx on public.product_images(product_id, sort_order);
create index orders_status_created_idx on public.orders(order_status, created_at desc);
create index orders_number_idx on public.orders(order_number);
create index order_items_order_idx on public.order_items(order_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger product_variants_set_updated_at before update on public.product_variants for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders for each row execute function public.set_updated_at();
create trigger banners_set_updated_at before update on public.banners for each row execute function public.set_updated_at();
create trigger store_settings_set_updated_at before update on public.store_settings for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Security-definer helper prevents profile RLS recursion and never accepts a role from the client.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'staff')
  );
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.banners enable row level security;
alter table public.store_settings enable row level security;

create policy "profiles read own profile" on public.profiles for select using (id = auth.uid());
create policy "admins read profiles" on public.profiles for select using (public.is_admin());
create policy "admins manage profiles" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

create policy "public reads active categories" on public.categories for select using (is_active or public.is_admin());
create policy "admins manage categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy "public reads active products" on public.products for select using (is_active or public.is_admin());
create policy "admins manage products" on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy "public reads images of active products" on public.product_images for select using (exists (select 1 from public.products p where p.id = product_id and (p.is_active or public.is_admin())));
create policy "admins manage product images" on public.product_images for all using (public.is_admin()) with check (public.is_admin());
create policy "public reads active variants of active products" on public.product_variants for select using (is_active and exists (select 1 from public.products p where p.id = product_id and (p.is_active or public.is_admin())));
create policy "admins manage variants" on public.product_variants for all using (public.is_admin()) with check (public.is_admin());
create policy "admins read orders" on public.orders for select using (public.is_admin());
create policy "admins read order items" on public.order_items for select using (public.is_admin());
create policy "public reads active banners" on public.banners for select using (is_active or public.is_admin());
create policy "admins manage banners" on public.banners for all using (public.is_admin()) with check (public.is_admin());
create policy "public reads store settings" on public.store_settings for select using (true);
create policy "admins manage store settings" on public.store_settings for all using (public.is_admin()) with check (public.is_admin());

-- Buckets are public-read because their object URLs are displayed directly in the storefront.
insert into storage.buckets (id, name, public) values ('products', 'products', true), ('banners', 'banners', true)
on conflict (id) do update set public = excluded.public;
create policy "public reads product images" on storage.objects for select using (bucket_id = 'products');
create policy "public reads banner images" on storage.objects for select using (bucket_id = 'banners');
create policy "admins upload product images" on storage.objects for insert with check (bucket_id = 'products' and public.is_admin());
create policy "admins update product images" on storage.objects for update using (bucket_id = 'products' and public.is_admin()) with check (bucket_id = 'products' and public.is_admin());
create policy "admins delete product images" on storage.objects for delete using (bucket_id = 'products' and public.is_admin());
create policy "admins upload banner images" on storage.objects for insert with check (bucket_id = 'banners' and public.is_admin());
create policy "admins update banner images" on storage.objects for update using (bucket_id = 'banners' and public.is_admin()) with check (bucket_id = 'banners' and public.is_admin());
create policy "admins delete banner images" on storage.objects for delete using (bucket_id = 'banners' and public.is_admin());

-- Database-side cleanup keeps managed storage assets from becoming orphaned on image or product deletion.
create or replace function public.delete_product_storage_object()
returns trigger language plpgsql security definer set search_path = public, storage as $$
begin
  if old.storage_path is not null then
    delete from storage.objects where bucket_id = 'products' and name = old.storage_path;
  end if;
  return old;
end;
$$;
create trigger product_image_storage_cleanup after delete on public.product_images for each row execute function public.delete_product_storage_object();

create or replace function public.delete_banner_storage_object()
returns trigger language plpgsql security definer set search_path = public, storage as $$
begin
  if old.storage_path is not null then
    delete from storage.objects where bucket_id = 'banners' and name = old.storage_path;
  end if;
  return old;
end;
$$;
create trigger banner_storage_cleanup after delete on public.banners for each row execute function public.delete_banner_storage_object();

create sequence public.order_number_sequence start 100001;
create or replace function public.next_order_number()
returns text language sql volatile set search_path = public as $$
  select 'VERA-' || to_char(current_date, 'YYYY') || '-' || lpad(nextval('public.order_number_sequence')::text, 6, '0');
$$;

-- Public checkout has no table INSERT policy. This RPC locks each variant, re-prices from products,
-- creates immutable snapshots and decrements stock atomically or rolls back every operation.
create or replace function public.create_order(
  p_customer jsonb,
  p_items jsonb,
  p_payment_method text default 'cod'
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_item record;
  v_variant record;
  v_settings record;
  v_order_id uuid;
  v_subtotal numeric(12,2) := 0;
  v_delivery numeric(12,2) := 0;
  v_cod_fee numeric(12,2) := 0;
  v_unit_price numeric(12,2);
  v_order_number text;
  v_quantity integer;
  v_email text := lower(trim(coalesce(p_customer ->> 'email', '')));
  v_phone text := regexp_replace(coalesce(p_customer ->> 'phone', ''), '\D', '', 'g');
begin
  if p_payment_method <> 'cod' then
    raise exception 'Only cash on delivery is currently available.' using errcode = '22023';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then
    raise exception 'Your bag is invalid. Please review it and try again.' using errcode = '22023';
  end if;
  if char_length(trim(coalesce(p_customer ->> 'name', ''))) < 3
    or v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'
    or v_phone !~ '^[6-9][0-9]{9}$'
    or char_length(trim(coalesce(p_customer ->> 'address_line1', ''))) < 8
    or char_length(trim(coalesce(p_customer ->> 'city', ''))) < 2
    or char_length(trim(coalesce(p_customer ->> 'state', ''))) < 2
    or coalesce(p_customer ->> 'pincode', '') !~ '^[0-9]{6}$' then
    raise exception 'Please check your delivery details and try again.' using errcode = '22023';
  end if;

  select * into v_settings from public.store_settings order by updated_at desc limit 1;
  if not found then
    select 1999::numeric as free_shipping_threshold, 99::numeric as delivery_fee, 49::numeric as cod_fee into v_settings;
  end if;

  for v_item in select * from jsonb_to_recordset(p_items) as x(variant_id uuid, quantity integer)
  loop
    v_quantity := v_item.quantity;
    if v_quantity is null or v_quantity < 1 or v_quantity > 10 then
      raise exception 'One of the requested quantities is invalid.' using errcode = '22023';
    end if;

    select pv.id, pv.sku, pv.size, pv.color, pv.stock_quantity, pv.is_active as variant_active,
           p.id as product_id, p.name as product_name, p.base_price, p.sale_price, p.is_active as product_active
      into v_variant
      from public.product_variants pv
      join public.products p on p.id = pv.product_id
      where pv.id = v_item.variant_id
      for update of pv;

    if not found or not v_variant.variant_active or not v_variant.product_active then
      raise exception 'A style in your bag is no longer available.' using errcode = 'P0001';
    end if;
    if v_variant.stock_quantity < v_quantity then
      raise exception '% / % is no longer available in the requested quantity.', v_variant.color, v_variant.size using errcode = 'P0001';
    end if;

    v_unit_price := coalesce(v_variant.sale_price, v_variant.base_price);
    v_subtotal := v_subtotal + (v_unit_price * v_quantity);
  end loop;

  v_delivery := case when v_subtotal >= v_settings.free_shipping_threshold then 0 else v_settings.delivery_fee end;
  v_cod_fee := v_settings.cod_fee;
  v_order_number := public.next_order_number();
  insert into public.orders (
    order_number, customer_name, customer_email, customer_phone, address_line1, address_line2,
    city, state, pincode, subtotal, discount, delivery_charge, total, payment_method
  ) values (
    v_order_number, trim(p_customer ->> 'name'), v_email, v_phone, trim(p_customer ->> 'address_line1'),
    nullif(trim(coalesce(p_customer ->> 'address_line2', '')), ''), trim(p_customer ->> 'city'), trim(p_customer ->> 'state'),
    p_customer ->> 'pincode', v_subtotal, 0, v_delivery + v_cod_fee, v_subtotal + v_delivery + v_cod_fee, 'cod'
  ) returning id into v_order_id;

  for v_item in select * from jsonb_to_recordset(p_items) as x(variant_id uuid, quantity integer)
  loop
    select pv.id, pv.sku, pv.size, pv.color, p.id as product_id, p.name as product_name,
           p.base_price, p.sale_price into v_variant
    from public.product_variants pv join public.products p on p.id = pv.product_id
    where pv.id = v_item.variant_id;
    v_unit_price := coalesce(v_variant.sale_price, v_variant.base_price);
    insert into public.order_items (order_id, product_id, variant_id, product_name, sku, size, color, quantity, unit_price, total_price)
    values (v_order_id, v_variant.product_id, v_variant.id, v_variant.product_name, v_variant.sku, v_variant.size, v_variant.color, v_item.quantity, v_unit_price, round(v_unit_price * v_item.quantity, 2));
    update public.product_variants set stock_quantity = stock_quantity - v_item.quantity where id = v_item.variant_id;
  end loop;

  return jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number, 'subtotal', v_subtotal, 'delivery_charge', v_delivery + v_cod_fee, 'total', v_subtotal + v_delivery + v_cod_fee, 'payment_status', 'pending', 'order_status', 'pending');
end;
$$;

-- All administration order-status changes use this RPC. A cancellation restores stock exactly once.
create or replace function public.set_order_status(p_order_id uuid, p_status text)
returns public.orders language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders;
  v_line record;
begin
  if not public.is_admin() then raise exception 'Not authorized.' using errcode = '42501'; end if;
  if p_status not in ('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled') then raise exception 'Invalid order status.' using errcode = '22023'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found.' using errcode = 'P0002'; end if;
  if v_order.order_status = 'cancelled' and p_status <> 'cancelled' then raise exception 'Cancelled orders cannot be reopened.' using errcode = '22023'; end if;
  if v_order.order_status <> 'cancelled' and p_status = 'cancelled' then
    for v_line in select variant_id, quantity from public.order_items where order_id = p_order_id
    loop
      if v_line.variant_id is not null then
        update public.product_variants set stock_quantity = stock_quantity + v_line.quantity where id = v_line.variant_id;
      end if;
    end loop;
  end if;
  update public.orders set order_status = p_status where id = p_order_id returning * into v_order;
  return v_order;
end;
$$;

grant execute on function public.create_order(jsonb, jsonb, text) to anon, authenticated;
grant execute on function public.set_order_status(uuid, text) to authenticated;
