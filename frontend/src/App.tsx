import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import NavBar from './components/NavBar/NavBar';
import Footer from './components/Footer/Footer';
import ChatBot from './components/ChatBot/ChatBot';
import { ChatProvider } from './context/ChatContext';

const Home        = lazy(() => import('./pages/Home/Home'));
const Shop        = lazy(() => import('./pages/Shop/Shop'));
const ProductDetail = lazy(() => import('./pages/ProductDetail/ProductDetail'));
const Cart        = lazy(() => import('./pages/Cart/Cart'));
const Checkout    = lazy(() => import('./pages/Checkout/Checkout'));
const Login       = lazy(() => import('./pages/Login/Login'));
const Register    = lazy(() => import('./pages/Register/Register'));
const About       = lazy(() => import('./pages/About/About'));
const AdminChat     = lazy(() => import('./pages/AdminChat/AdminChat'));
const AdminProducts = lazy(() => import('./pages/AdminProducts/AdminProducts'));

const LoadingFallback: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', fontSize: '2rem' }}>
    &#x1F41F;
  </div>
);

const NotFound: React.FC = () => (
  <div style={{ textAlign: 'center', padding: '6rem 2rem', minHeight: '60vh' }}>
    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>&#x1F41F;</div>
    <h2 style={{ fontSize: '1.8rem', color: 'var(--dark)', marginBottom: '0.5rem' }}>Page Not Found</h2>
    <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>The page you are looking for does not exist.</p>
    <a href="/" style={{ display: 'inline-block', background: 'var(--primary)', color: 'var(--dark)', textDecoration: 'none', padding: '0.75rem 2rem', borderRadius: '50px', fontWeight: 700 }}>
      Go Home
    </a>
  </div>
);

const App: React.FC = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <ChatProvider>
      <div className={`page-wrapper${isAdmin ? ' page-wrapper--admin' : ''}`}>
        <NavBar />
        <main className={`page-content${isAdmin ? ' page-content--admin' : ''}`}>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/"          element={<Home />} />
              <Route path="/shop"      element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart"      element={<Cart />} />
              <Route path="/checkout"  element={<Checkout />} />
              <Route path="/login"     element={<Login />} />
              <Route path="/register"  element={<Register />} />
              <Route path="/about"     element={<About />} />
              <Route path="/admin"          element={<AdminChat />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="*"          element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        {!isAdmin && <Footer />}
        {!isAdmin && <ChatBot />}
      </div>
    </ChatProvider>
  );
};

export default App;
