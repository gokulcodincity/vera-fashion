import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const UIContext = createContext(null);

/** Shared state for mutually exclusive search, bag and product-preview overlays. */
export function UIProvider({ children }) {
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [isCartOpen, setCartOpen] = useState(false);
  const [quickViewProductId, setQuickViewProductId] = useState(null);

  const openSearch = useCallback(() => {
    setCartOpen(false);
    setQuickViewProductId(null);
    setSearchOpen(true);
  }, []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  const openCart = useCallback(() => {
    setSearchOpen(false);
    setQuickViewProductId(null);
    setCartOpen(true);
  }, []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const openQuickView = useCallback((productId) => {
    setSearchOpen(false);
    setCartOpen(false);
    setQuickViewProductId(productId);
  }, []);
  const closeQuickView = useCallback(() => setQuickViewProductId(null), []);

  const value = useMemo(
    () => ({
      isSearchOpen,
      openSearch,
      closeSearch,
      isCartOpen,
      openCart,
      closeCart,
      quickViewProductId,
      openQuickView,
      closeQuickView,
    }),
    [
      isSearchOpen,
      openSearch,
      closeSearch,
      isCartOpen,
      openCart,
      closeCart,
      quickViewProductId,
      openQuickView,
      closeQuickView,
    ]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used inside <UIProvider>');
  return context;
}

export default UIContext;
