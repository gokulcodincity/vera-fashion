import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'supabase', 'seed.sql');
const vite = await createServer({ root, server: { middlewareMode: true }, appType: 'custom' });
const { products } = await vite.ssrLoadModule('/src/data/products.js');
await vite.close();
const sql = (value) => `'${String(value ?? '').replaceAll("'", "''")}'`;
const slugify = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const variantSku = (product, color, size, index) => `${slugify(product.id).slice(0, 18)}-${slugify(color).slice(0, 12)}-${slugify(size).slice(0, 8)}-${index + 1}`.toUpperCase();
const categories = [...new Set(products.map((product) => product.category))].sort();

const lines = [
  '-- Generated from src/data/products.js. Do not hand-edit; run npm run supabase:seed to refresh.',
  'begin;',
  "insert into public.store_settings (id, store_name, tagline, phone, whatsapp, email, address, opening_hours) values ('00000000-0000-0000-0000-000000000001', 'VÉRA', 'Style That Speaks.', '+91 98765 43210', '919876543210', 'hello@verafashion.in', '24 Anna Salai, Thousand Lights, Chennai, Tamil Nadu 600002', '[{\"days\":\"Monday - Friday\",\"hours\":\"10:30 AM - 9:00 PM\"},{\"days\":\"Saturday\",\"hours\":\"10:00 AM - 9:30 PM\"},{\"days\":\"Sunday\",\"hours\":\"11:00 AM - 8:00 PM\"}]'::jsonb) on conflict (id) do update set store_name = excluded.store_name, tagline = excluded.tagline, phone = excluded.phone, whatsapp = excluded.whatsapp, email = excluded.email, address = excluded.address, opening_hours = excluded.opening_hours;",
];
for (const category of categories) lines.push(`insert into public.categories (name, slug, is_active, sort_order) values (${sql(category)}, ${sql(slugify(category))}, true, ${categories.indexOf(category)}) on conflict (slug) do update set name = excluded.name, sort_order = excluded.sort_order;`);
for (const product of products) {
  const details = JSON.stringify(product.details || {});
  const highlights = JSON.stringify(product.highlights || []);
  const regularPrice = product.originalPrice ?? product.price;
  const salePrice = product.originalPrice ? product.price : null;
  lines.push(`insert into public.products (name, slug, description, category_id, gender, base_price, original_price, sale_price, highlights, details, rating, review_count, is_active, is_new, is_best_seller, is_featured) select ${sql(product.name)}, ${sql(product.id)}, ${sql(product.description)}, id, ${sql(product.gender)}, ${regularPrice}, ${product.originalPrice ?? 'null'}, ${salePrice ?? 'null'}, ${sql(highlights)}::jsonb, ${sql(details)}::jsonb, ${product.rating || 0}, ${product.reviewCount || 0}, true, ${Boolean(product.isNew)}, ${Boolean(product.isBestSeller)}, ${Boolean(product.isBestSeller)} from public.categories where slug = ${sql(slugify(product.category))} on conflict (slug) do update set name = excluded.name, description = excluded.description, base_price = excluded.base_price, original_price = excluded.original_price, sale_price = excluded.sale_price, highlights = excluded.highlights, details = excluded.details, rating = excluded.rating, review_count = excluded.review_count, is_active = true, is_new = excluded.is_new, is_best_seller = excluded.is_best_seller;`);
  product.images.forEach((image, index) => lines.push(`insert into public.product_images (product_id, image_url, alt_text, sort_order, is_primary) select id, ${sql(image)}, ${sql(`${product.name} ${index === 0 ? 'primary view' : `view ${index + 1}`}`)}, ${index}, ${index === 0} from public.products where slug = ${sql(product.id)} on conflict do nothing;`));
  let index = 0;
  for (const color of product.colors || [{ name: 'Default', hex: null }]) for (const size of product.sizes || ['One Size']) {
    const sku = variantSku(product, color.name, size, index++);
    lines.push(`insert into public.product_variants (product_id, sku, size, color, color_hex, stock_quantity, is_active) select id, ${sql(sku)}, ${sql(size)}, ${sql(color.name)}, ${color.hex ? sql(color.hex) : 'null'}, 10, true from public.products where slug = ${sql(product.id)} on conflict (product_id, size, color) do update set sku = excluded.sku, color_hex = excluded.color_hex, is_active = true;`);
  }
}
lines.push('commit;');
fs.writeFileSync(output, `${lines.join('\n')}\n`);
console.log(`Wrote ${products.length} products and ${categories.length} categories to ${path.relative(root, output)}.`);
