import { requireSupabase } from '../lib/supabase';

const unique = (values) => [...new Set(values.filter(Boolean))];
const number = (value) => Number(value || 0);

/** Adapts normalized Postgres records to the existing VÉRA product-card contract. */
export function mapProduct(record) {
  if (!record) return null;
  const images = [...(record.product_images || [])].sort((a, b) => a.sort_order - b.sort_order);
  const variants = [...(record.product_variants || [])].sort((a, b) => a.size.localeCompare(b.size) || a.color.localeCompare(b.color));
  const price = number(record.sale_price ?? record.base_price);
  const originalPrice = record.original_price && number(record.original_price) > price ? number(record.original_price) : null;
  const colors = unique(variants.map((variant) => variant.color)).map((name) => {
    const match = variants.find((variant) => variant.color === name);
    return { name, hex: match?.color_hex || '#8b837a' };
  });
  return {
    ...record,
    id: record.slug,
    databaseId: record.id,
    category: record.categories?.name || 'Uncategorised',
    categorySlug: record.categories?.slug || '',
    price,
    originalPrice,
    discount: originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0,
    isSale: Boolean(originalPrice),
    isNew: record.is_new,
    isBestSeller: record.is_best_seller,
    isFeatured: record.is_featured,
    rating: number(record.rating),
    reviewCount: Number(record.review_count || 0),
    sizes: unique(variants.map((variant) => variant.size)),
    colors,
    variants,
    images: images.map((image) => image.image_url).filter(Boolean),
    highlights: Array.isArray(record.highlights) ? record.highlights : [],
    details: record.details || {},
    searchIndex: [record.name, record.categories?.name, record.gender, record.description].filter(Boolean).join(' ').toLowerCase(),
  };
}

const SELECT = 'id,name,slug,description,gender,base_price,original_price,sale_price,highlights,details,rating,review_count,is_active,is_new,is_best_seller,is_featured,created_at,categories(name,slug),product_images(id,image_url,storage_path,alt_text,sort_order,is_primary),product_variants(id,sku,size,color,color_hex,stock_quantity,is_active)';

export async function getCataloguePage({ filters = {}, page = 0, pageSize = 15 } = {}) {
  const client = requireSupabase();
  let query = client.from('products').select(SELECT, { count: 'exact' });
  if (filters.categories?.length) {
    const { data, error } = await client.from('categories').select('id').in('name', filters.categories);
    if (error) throw error;
    query = query.in('category_id', (data || []).map((item) => item.id));
  }
  if (filters.genders?.length) query = query.in('gender', filters.genders);
  if (filters.onSale || filters.tag === 'sale') query = query.not('sale_price', 'is', null);
  if (filters.tag === 'new') query = query.eq('is_new', true);
  if (filters.tag === 'bestseller') query = query.eq('is_best_seller', true);
  if (filters.q?.trim()) {
    const term = filters.q.trim().replace(/[%,()]/g, '');
    query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%,gender.ilike.%${term}%`);
  }
  const sort = filters.sort || 'featured';
  if (sort === 'price-asc') query = query.order('sale_price', { ascending: true, nullsFirst: false }).order('base_price');
  else if (sort === 'price-desc') query = query.order('sale_price', { ascending: false, nullsFirst: false }).order('base_price', { ascending: false });
  else if (sort === 'new') query = query.order('created_at', { ascending: false });
  else if (sort === 'rating') query = query.order('rating', { ascending: false });
  else query = query.order('is_best_seller', { ascending: false }).order('is_featured', { ascending: false }).order('created_at', { ascending: false });
  const { data, error, count } = await query.range(page * pageSize, page * pageSize + pageSize - 1);
  if (error) throw error;
  let items = (data || []).map(mapProduct);
  if (filters.sizes?.length) items = items.filter((product) => filters.sizes.some((size) => product.sizes.includes(size)));
  if (filters.priceBands?.length) {
    const bands = { 'under-1500': [0, 1499], '1500-3000': [1500, 3000], '3000-5000': [3001, 5000], 'above-5000': [5001, Infinity] };
    items = items.filter((product) => filters.priceBands.some((band) => product.price >= bands[band][0] && product.price <= bands[band][1]));
  }
  return { items, count: count || 0 };
}

export async function getProductBySlug(slug) {
  const { data, error } = await requireSupabase().from('products').select(SELECT).eq('slug', slug).maybeSingle();
  if (error) throw error;
  return mapProduct(data);
}

export async function getCategories() {
  const { data, error } = await requireSupabase().from('categories').select('id,name,slug,description,image_url,sort_order').order('sort_order').order('name');
  if (error) throw error;
  return data || [];
}

export function getVariant(product, size, color) {
  return product?.variants?.find((variant) => variant.size === size && variant.color === color) || null;
}
