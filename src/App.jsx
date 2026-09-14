import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import SearchOverlay from './components/SearchOverlay';
import CartDrawer from './components/CartDrawer';
import QuickViewModal from './components/QuickViewModal';
import WhatsAppButton from './components/WhatsAppButton';
import ToastHost from './components/ToastHost';
import RequireAdmin from './components/RequireAdmin';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ToastProvider } from './context/ToastContext';
import { UIProvider } from './context/UIContext';
import AdminLayout from './admin/layouts/AdminLayout';
import AdminLogin from './admin/pages/AdminLogin';
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminProducts from './admin/pages/AdminProducts';
import ProductEditor from './admin/pages/ProductEditor';
import AdminCategories from './admin/pages/AdminCategories';
import AdminInventory from './admin/pages/AdminInventory';
import AdminOrders from './admin/pages/AdminOrders';
import AdminBanners from './admin/pages/AdminBanners';
import AdminSettings from './admin/pages/AdminSettings';
import Home from './pages/Home';

const Shop = lazy(() => import('./pages/Shop'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Cart = lazy(() => import('./pages/Cart'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Checkout = lazy(() => import('./pages/Checkout'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const InfoPage = lazy(() => import('./pages/InfoPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

function RouteFallback() {
  return <div className="shell flex min-h-[60vh] items-center justify-center py-24"><div className="flex flex-col items-center gap-4"><span className="h-8 w-8 animate-spin rounded-full border border-line border-t-ink" /><p className="text-[10px] uppercase tracking-[0.24em] text-muted">Loading</p></div></div>;
}

function StorefrontRoutes() {
  return <div className="flex min-h-screen flex-col"><Navbar /><main className="flex-1"><Suspense fallback={<RouteFallback />}><Routes><Route path="/" element={<Home />} /><Route path="/shop" element={<Shop />} /><Route path="/product/:id" element={<ProductDetails />} /><Route path="/cart" element={<Cart />} /><Route path="/wishlist" element={<Wishlist />} /><Route path="/checkout" element={<Checkout />} /><Route path="/about" element={<About />} /><Route path="/contact" element={<Contact />} /><Route path="/info/:slug" element={<InfoPage />} /><Route path="*" element={<NotFound />} /></Routes></Suspense></main><Footer /></div>;
}

export default function App() {
  return <AuthProvider><ToastProvider><CartProvider><WishlistProvider><UIProvider><ScrollToTop /><Routes><Route path="/admin/login" element={<AdminLogin />} /><Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}><Route index element={<AdminDashboard />} /><Route path="products" element={<AdminProducts />} /><Route path="products/new" element={<ProductEditor />} /><Route path="products/:id/edit" element={<ProductEditor />} /><Route path="categories" element={<AdminCategories />} /><Route path="inventory" element={<AdminInventory />} /><Route path="orders" element={<AdminOrders />} /><Route path="banners" element={<AdminBanners />} /><Route path="settings" element={<AdminSettings />} /></Route><Route path="*" element={<StorefrontRoutes />} /></Routes><SearchOverlay /><CartDrawer /><QuickViewModal /><WhatsAppButton /><ToastHost /></UIProvider></WishlistProvider></CartProvider></ToastProvider></AuthProvider>;
}
