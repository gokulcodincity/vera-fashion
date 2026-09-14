import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { getProductById as getStaticProduct } from '../data/products';
import { store } from '../config/store';

const CartContext = createContext(null);
const STORAGE_KEY = 'vera:cart:v2';
const legacyKey = 'vera:cart:v1';
const lineKey = (productId, variantId, size, color) => `${productId}|${variantId || `${size || 'os'}:${color || 'default'}`}`;

const snapshot = (product) => ({ id: product.id, databaseId: product.databaseId || null, name: product.name, images: product.images || [], price: Number(product.price || 0), originalPrice: product.originalPrice || null, sizes: product.sizes || [], colors: product.colors || [], category: product.category || '', gender: product.gender || '' });

/** Browser-persisted convenience cart. The database re-prices and re-checks variant stock at checkout. */
export function CartProvider({ children }) {
  const [rawItems, setRawItems] = useLocalStorage(STORAGE_KEY, []);
  const [legacyItems, setLegacyItems] = useLocalStorage(legacyKey, []);

  useEffect(() => {
    if (Array.isArray(rawItems) && rawItems.length) return;
    if (!Array.isArray(legacyItems) || legacyItems.length === 0) return;
    setRawItems(legacyItems.map((line) => ({ ...line, productSnapshot: snapshot(getStaticProduct(line.productId) || {}) })));
    setLegacyItems([]);
  }, [rawItems, legacyItems, setLegacyItems, setRawItems]);

  const normalizedRaw = useMemo(() => {
    if (Array.isArray(rawItems) && rawItems.length) return rawItems;
    return Array.isArray(legacyItems) ? legacyItems.map((line) => ({ ...line, productSnapshot: snapshot(getStaticProduct(line.productId) || {}) })) : [];
  }, [rawItems, legacyItems]);

  const items = useMemo(() => normalizedRaw.map((line) => {
    const product = line.productSnapshot || getStaticProduct(line.productId);
    if (!product?.name) return null;
    const quantity = Math.min(Math.max(Number(line.quantity) || 1, 1), 10);
    const size = line.size || product.sizes?.[0] || 'One Size';
    const color = line.color || product.colors?.[0]?.name || 'Default';
    const unitPrice = Number(line.unitPrice ?? product.price ?? 0);
    return { key: lineKey(line.productId, line.variantId, size, color), productId: line.productId, variantId: line.variantId || null, product, size, color, quantity, unitPrice, lineTotal: unitPrice * quantity };
  }).filter(Boolean), [normalizedRaw]);

  const addItem = useCallback((product, { size, color, quantity = 1, variantId } = {}) => {
    if (!product) return;
    const resolvedSize = size || product.sizes?.[0] || 'One Size';
    const resolvedColor = color || product.colors?.[0]?.name || 'Default';
    const variant = product.variants?.find((item) => item.id === variantId || (item.size === resolvedSize && item.color === resolvedColor));
    if (variant && (!variant.is_active || variant.stock_quantity < 1)) return;
    const resolvedVariantId = variant?.id || variantId || null;
    const productId = product.databaseId || product.id;
    const key = lineKey(productId, resolvedVariantId, resolvedSize, resolvedColor);
    setRawItems((current) => {
      const list = Array.isArray(current) ? [...current] : [];
      const index = list.findIndex((line) => lineKey(line.productId, line.variantId, line.size, line.color) === key);
      if (index > -1) { list[index] = { ...list[index], quantity: Math.min((Number(list[index].quantity) || 1) + quantity, 10) }; return list; }
      return [...list, { productId, variantId: resolvedVariantId, size: resolvedSize, color: resolvedColor, quantity: Math.min(quantity, 10), unitPrice: Number(product.price || 0), productSnapshot: snapshot(product) }];
    });
  }, [setRawItems]);

  const updateQuantity = useCallback((key, quantity) => {
    const next = Math.min(Math.max(quantity, 1), 10);
    setRawItems((current) => (Array.isArray(current) ? current : []).map((line) => lineKey(line.productId, line.variantId, line.size, line.color) === key ? { ...line, quantity: next } : line));
  }, [setRawItems]);
  const increment = useCallback((key) => { const line = items.find((item) => item.key === key); if (line) updateQuantity(key, line.quantity + 1); }, [items, updateQuantity]);
  const decrement = useCallback((key) => { const line = items.find((item) => item.key === key); if (line) updateQuantity(key, line.quantity - 1); }, [items, updateQuantity]);
  const removeItem = useCallback((key) => setRawItems((current) => (Array.isArray(current) ? current : []).filter((line) => lineKey(line.productId, line.variantId, line.size, line.color) !== key)), [setRawItems]);
  const clearCart = useCallback(() => setRawItems([]), [setRawItems]);

  const totals = useMemo(() => {
    const totalItems = items.reduce((sum, line) => sum + line.quantity, 0);
    const subtotal = items.reduce((sum, line) => sum + line.lineTotal, 0);
    const listTotal = items.reduce((sum, line) => sum + Number(line.product.originalPrice || line.unitPrice) * line.quantity, 0);
    const savings = Math.max(0, listTotal - subtotal);
    const delivery = subtotal === 0 || subtotal >= store.freeShippingThreshold ? 0 : store.deliveryFee;
    return { totalItems, subtotal, listTotal, savings, delivery, total: subtotal + delivery, qualifiesForFreeShipping: subtotal >= store.freeShippingThreshold, amountToFreeShipping: Math.max(0, store.freeShippingThreshold - subtotal) };
  }, [items]);

  const value = useMemo(() => ({ items, addItem, removeItem, increment, decrement, updateQuantity, clearCart, ...totals, isEmpty: items.length === 0 }), [items, addItem, removeItem, increment, decrement, updateQuantity, clearCart, totals]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() { const context = useContext(CartContext); if (!context) throw new Error('useCart must be used inside <CartProvider>'); return context; }
export default CartContext;
