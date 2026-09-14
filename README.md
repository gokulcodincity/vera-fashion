# VÉRA Storefront + Supabase Admin

VÉRA keeps the original React/Vite/Tailwind customer experience and adds a Supabase-backed catalogue, variant inventory, protected administration, Storage, and transactional COD ordering.

## 1. Local setup

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Set only these browser-safe values in `.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_ANON_KEY
```

Never put a `service_role` key in Vite, Vercel, source code, or client JavaScript. `.env*` is ignored except `.env.example`.

Without these variables the public site intentionally continues to use its local demo catalogue. `/admin/login` explains the missing setup instead of failing silently.

## 2. Supabase project and migration

1. Create a Supabase project in the region nearest the client.
2. In **Authentication → Providers**, leave email/password enabled. Do not expose public sign-up in this application.
3. Apply `supabase/migrations/202609130001_initial_commerce.sql` with the Supabase CLI (`supabase db push`) or the SQL Editor.
4. Generate the seed from the current 39-product VÉRA catalogue:
   ```powershell
   npm run supabase:seed
   ```
5. Run the generated `supabase/seed.sql` in the SQL Editor or with `supabase db reset` in local development.

The migration creates PostgreSQL tables, indexes, checks, RLS, public-read Storage buckets (`products`, `banners`), image-cleanup triggers, an atomic `create_order` RPC, and the cancellation-safe `set_order_status` RPC. Re-run the seed after changing `src/data/products.js`; it upserts categories, products, variants, and image records.

Seed stock is deliberately `10` per generated size/colour combination for development. Replace it with verified client stock before production.

## 3. Provision the first admin intentionally

Create the user in **Authentication → Users → Add user** (or an internal provisioning workflow). Then set its profile role in SQL:

```sql
update public.profiles
set role = 'admin', full_name = 'Store Owner'
where id = 'AUTH_USER_UUID';
```

The `handle_new_user` trigger makes the profile row. The frontend redirects unauthenticated users from `/admin`, but authorization is ultimately enforced by `public.is_admin()` inside RLS policies and security-definer RPCs.

## 4. Storage and product images

Only JPEG, PNG, and WebP files up to 8 MB are accepted by the browser upload workflow. File names use `crypto.randomUUID()` beneath a per-product folder to prevent collisions. The client uploads with the anonymous key; Storage policies verify the authenticated profile is an admin.

Deleting a `product_images` or `banners` database record triggers corresponding Storage-object cleanup when `storage_path` exists. Deleting a product cascades its image rows, variants, and their managed Storage assets. Do not manually remove database rows without using the dashboard/service workflow unless you understand the cleanup trigger.

## 5. Client administration

After a role-provisioned login at `/admin/login`:

- **Products**: create/edit active status, merchandising flags, price, description, images, and variants. Save first, then upload multiple images. Each variant has SKU, colour, size, and stock.
- **Categories**: add/edit/deactivate/reorder. PostgreSQL prevents deletion while products reference the category.
- **Inventory**: change variant stock. `0` is Out of Stock; `1–5` is Low Stock by default.
- **Orders**: review customer/order snapshots and update status. Setting `cancelled` calls `set_order_status`, which restores variant stock exactly once; do not bypass it with direct SQL updates.
- **Banners**: manage banner database records. Image upload can use the `banners` bucket via the same secured storage service.
- **Store settings**: update name, contact, social, and commerce settings.

## 6. Customer catalogue, cart, and orders

Supabase product records use a stable `slug` for public URLs and a UUID database ID internally. `product_variants` owns availability: a size/colour selection maps to its exact variant ID. The local cart stores that `variantId`, selected option text, product snapshot, displayed unit price, and quantity.

When Supabase is configured, checkout sends only selected variant IDs and quantities to `create_order`. The database function locks each variant, confirms availability, calculates authoritative prices, creates immutable `order_items` snapshots, deducts stock, and commits as one transaction. If any item is insufficient, PostgreSQL rolls back the entire request and the local bag stays intact. Browser prices and stock are never authoritative.

Only Cash on Delivery is accepted by the RPC. Do not collect real card/CVV values or claim UPI/card payments work until a PCI-compliant payment provider is integrated.

## 7. Security model and verification

Public visitors can read only active categories, products, matching images, active variants, active banners, and public settings. They cannot write products, variants, stock, settings, orders, Storage objects, or roles. There is deliberately no public table-insert policy for orders.

Run these checks from a browser with the anonymous key (or Supabase API explorer):

- `insert/update/delete` on products, variants, categories, settings, and orders must fail.
- Storage uploads/deletes in `products` and `banners` must fail without an admin session.
- Anonymous order table reads/inserts must fail; only `rpc('create_order', ...)` may succeed.
- An authenticated non-admin must fail all management mutations.
- An admin may manage allowed records.
- Set a variant to 0, add it in a second browser, and confirm checkout fails without negative stock.
- Cancel an order twice and confirm stock is restored only on the first change.

Use Supabase logs and the SQL Editor for database-level validation. The repo cannot execute migrations or RLS tests without your Supabase URL/project credentials.

## 8. Vercel deployment

1. Import the repository into Vercel.
2. Set build command `npm run build` and output directory `dist`.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in **Project Settings → Environment Variables** for Preview and Production.
4. Add the Vercel production and preview URLs to Supabase **Authentication → URL Configuration** (Site URL and Redirect URLs).
5. Deploy. Confirm `/admin/login`, public product pages, Storage URLs, and the checkout RPC against the production project.

For a custom domain, add it in Vercel, complete the DNS records at the registrar, then add the final HTTPS domain to Supabase Auth redirect configuration.

## 9. Backups, recovery, and operations

Enable Supabase point-in-time recovery on production plans that support it. Export important data periodically, keep product image originals outside the public bucket if required, and test a restore before relying on it. Restrict Supabase organization access, rotate publishable keys only through a planned deployment, and review Auth/Database/Storage logs after each launch.

## 10. Troubleshooting

- **Admin redirects to login**: confirm `.env.local` is loaded, the user exists in `auth.users`, and `profiles.role` is `admin` or `staff`.
- **RLS permission error**: do not weaken policies. Check the authenticated user and role with `select * from public.profiles where id = auth.uid();` in an authenticated context.
- **Images fail to upload**: verify bucket policies/migration, admin role, type/size limit, and browser network errors.
- **Checkout says a style is unavailable**: stock changed since the item was added; return to the product page, select an available variant, and add it again.
- **No products after enabling Supabase**: apply the migration and run `supabase/seed.sql`; check that products and categories are active.

## Validation commands

```powershell
npm run supabase:seed
npm run build
```

The existing browser checks remain useful for the no-credentials fallback. Add a configured-project test pass for admin RLS, Storage policies, and concurrent checkout before a real client launch.
