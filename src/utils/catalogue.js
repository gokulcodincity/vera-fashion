/** Filtering, sorting and searching helpers for the catalogue. */

export const PRICE_BANDS = [
  { id: 'under-1500', label: 'Under 1,500', min: 0, max: 1499 },
  { id: '1500-3000', label: '1,500 - 3,000', min: 1500, max: 3000 },
  { id: '3000-5000', label: '3,000 - 5,000', min: 3001, max: 5000 },
  { id: 'above-5000', label: '5,000 and above', min: 5001, max: Infinity },
];

export const EMPTY_FILTERS = {
  q: '',
  categories: [],
  genders: [],
  sizes: [],
  priceBands: [],
  onSale: false,
  tag: '',
};

/** Number of filters the shopper has actively applied. */
export function countActiveFilters(filters) {
  return (
    filters.categories.length +
    filters.genders.length +
    filters.sizes.length +
    filters.priceBands.length +
    (filters.onSale ? 1 : 0) +
    (filters.q ? 1 : 0) +
    (filters.tag ? 1 : 0)
  );
}

function matchesPrice(product, bandIds) {
  if (bandIds.length === 0) return true;
  return bandIds.some((id) => {
    const band = PRICE_BANDS.find((b) => b.id === id);
    if (!band) return false;
    return product.price >= band.min && product.price <= band.max;
  });
}

function matchesTag(product, tag) {
  switch (tag) {
    case 'new':
      return product.isNew;
    case 'bestseller':
      return product.isBestSeller;
    case 'sale':
      return product.isSale;
    default:
      return true;
  }
}

export function filterProducts(products, filters) {
  const query = filters.q.trim().toLowerCase();

  return products.filter((product) => {
    if (query && !product.searchIndex.includes(query)) return false;
    if (filters.categories.length && !filters.categories.includes(product.category)) return false;
    if (filters.genders.length && !filters.genders.includes(product.gender)) return false;
    if (filters.sizes.length && !filters.sizes.some((size) => product.sizes.includes(size)))
      return false;
    if (filters.onSale && !product.isSale) return false;
    if (!matchesPrice(product, filters.priceBands)) return false;
    if (filters.tag && !matchesTag(product, filters.tag)) return false;
    return true;
  });
}

export function sortProducts(list, sort) {
  const sorted = [...list];
  switch (sort) {
    case 'price-asc':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price);
    case 'rating':
      return sorted.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    case 'discount':
      return sorted.sort((a, b) => b.discount - a.discount);
    case 'new':
      return sorted.sort((a, b) => Number(b.isNew) - Number(a.isNew) || b.rating - a.rating);
    case 'featured':
    default:
      return sorted.sort(
        (a, b) =>
          Number(b.isBestSeller) - Number(a.isBestSeller) ||
          Number(b.isNew) - Number(a.isNew) ||
          b.reviewCount - a.reviewCount
      );
  }
}

/** Ranked search used by the search overlay. */
export function searchProducts(products, term, limit = 8) {
  const query = term.trim().toLowerCase();
  if (query.length < 2) return [];

  return products
    .map((product) => {
      const name = product.name.toLowerCase();
      let score = 0;
      if (name.startsWith(query)) score = 100;
      else if (name.includes(query)) score = 80;
      else if (product.category.toLowerCase().includes(query)) score = 60;
      else if (product.gender.toLowerCase() === query) score = 50;
      else if (product.searchIndex.includes(query)) score = 30;
      return { product, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.product.rating - a.product.rating)
    .slice(0, limit)
    .map((entry) => entry.product);
}
