import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../types';
import { getWishlist } from '../../services/api';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import ProductCard from '../../components/ProductCard/ProductCard';
import './Wishlist.css';

const Wishlist: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { wishlist, count } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    getWishlist()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated, count]);

  if (!isAuthenticated) {
    return (
      <div className="wishlist-page">
        <div className="wishlist-empty">
          <span className="wishlist-empty__icon">🔒</span>
          <h2>Sign in to view your wishlist</h2>
          <p>Your saved items will sync across devices when you're logged in.</p>
          <Link to="/login" className="wishlist-btn">Login / Register</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="wishlist-hero">
        <h1 className="wishlist-hero__title">My Wishlist</h1>
        <p className="wishlist-hero__sub">
          {count > 0 ? `${count} saved ${count === 1 ? 'item' : 'items'}` : 'Nothing saved yet'}
        </p>
      </div>

      <div className="wishlist-content">
        {loading ? (
          <div className="wishlist-grid">
            {[1, 2, 3].map(i => <div key={i} className="skeleton-card" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="wishlist-empty">
            <span className="wishlist-empty__icon">🐠</span>
            <h2>Your wishlist is empty</h2>
            <p>Browse the shop and tap ♡ on any product to save it here.</p>
            <Link to="/shop" className="wishlist-btn">Explore Products</Link>
          </div>
        ) : (
          <div className="wishlist-grid">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
