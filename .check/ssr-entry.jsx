/* Verification harness: renders every page with the real providers so any
   runtime error surfaces outside the browser. Not part of the shipped app. */
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { Routes, Route } from 'react-router-dom';

import Navbar from '../src/components/Navbar';
import Footer from '../src/components/Footer';
import { ToastProvider } from '../src/context/ToastContext';
import { CartProvider } from '../src/context/CartContext';
import { WishlistProvider } from '../src/context/WishlistContext';
import { UIProvider } from '../src/context/UIContext';

import Home from '../src/pages/Home';
import Shop from '../src/pages/Shop';
import ProductDetails from '../src/pages/ProductDetails';
import Cart from '../src/pages/Cart';
import Wishlist from '../src/pages/Wishlist';
import Checkout from '../src/pages/Checkout';
import About from '../src/pages/About';
import Contact from '../src/pages/Contact';
import InfoPage from '../src/pages/InfoPage';
import NotFound from '../src/pages/NotFound';

import { products } from '../src/data/products';
import { infoPageSlugs } from '../src/data/infoPages';

function Tree({ url }) {
  return (
    <ToastProvider>
      <CartProvider>
        <WishlistProvider>
          <UIProvider>
            <StaticRouter location={url}>
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/info/:slug" element={<InfoPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Footer />
            </StaticRouter>
          </UIProvider>
        </WishlistProvider>
      </CartProvider>
    </ToastProvider>
  );
}

export function run() {
  const urls = [
    '/',
    '/shop',
    '/shop?gender=Women',
    '/shop?gender=Men&category=Shirts&size=M&price=1500-3000&sale=1&sort=price-asc',
    '/shop?tag=new',
    '/shop?tag=bestseller',
    '/shop?tag=sale',
    '/shop?q=dress',
    '/shop?q=zzzzzz',
    '/cart',
    '/wishlist',
    '/checkout',
    '/about',
    '/contact',
    '/nope-404',
    ...infoPageSlugs.map((slug) => `/info/${slug}`),
    ...products.map((product) => `/product/${product.id}`),
  ];

  const failures = [];
  let imageUrls = new Set();

  urls.forEach((url) => {
    try {
      const html = renderToString(<Tree url={url} />);
      const matches = html.match(/https:\/\/images\.unsplash\.com\/[^"'\s]+/g) || [];
      matches.forEach((m) => imageUrls.add(m.replace(/&amp;/g, '&')));
      if (html.length < 500) failures.push(`${url} :: suspiciously short output`);
    } catch (error) {
      failures.push(`${url} :: ${error.message}`);
    }
  });

  return { total: urls.length, failures, imageUrls: [...imageUrls] };
}

export { products } from '../src/data/products';
