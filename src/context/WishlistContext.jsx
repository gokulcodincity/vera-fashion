import { createContext, useCallback, useContext, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { getProductById } from '../data/products';

const WishlistContext = createContext(null);

const STORAGE_KEY = 'vera:wishlist:v1';

export function WishlistProvider({ children }) {
  const [ids, setIds] = useLocalStorage(STORAGE_KEY, []);

  const safeIds = useMemo(() => (Array.isArray(ids) ? ids : []), [ids]);

  const items = useMemo(
    () => safeIds.map(getProductById).filter(Boolean),
    [safeIds]
  );

  const isWishlisted = useCallback(
    (productId) => safeIds.includes(productId),
    [safeIds]
  );

  const add = useCallback(
    (productId) => setIds((current) => {
      const list = Array.isArray(current) ? current : [];
      return list.includes(productId) ? list : [productId, ...list];
    }),
    [setIds]
  );

  const remove = useCallback(
    (productId) =>
      setIds((current) => (Array.isArray(current) ? current : []).filter((id) => id !== productId)),
    [setIds]
  );

  /** Returns true when the product ended up in the wishlist. */
  const toggle = useCallback(
    (productId) => {
      const nowWishlisted = !safeIds.includes(productId);
      if (nowWishlisted) add(productId);
      else remove(productId);
      return nowWishlisted;
    },
    [safeIds, add, remove]
  );

  const clear = useCallback(() => setIds([]), [setIds]);

  const value = useMemo(
    () => ({
      items,
      ids: safeIds,
      count: items.length,
      isWishlisted,
      add,
      remove,
      toggle,
      clear,
      isEmpty: items.length === 0,
    }),
    [items, safeIds, isWishlisted, add, remove, toggle, clear]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used inside <WishlistProvider>');
  return context;
}

export default WishlistContext;
