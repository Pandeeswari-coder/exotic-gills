import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Product } from '../../types';
import { getProduct } from '../../services/api';
import { useCart } from '../../context/CartContext';
import './ProductDetail.css';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedMsg, setAddedMsg] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getProduct(id)
      .then(setProduct)
      .catch(() => setError('Product not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity);
    setAddedMsg('Added to cart!');
    setTimeout(() => setAddedMsg(''), 2500);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addToCart(product, quantity);
    navigate('/cart');
  };

  const imageSrc = product?.image
    ? (product.image.startsWith('http') || product.image.startsWith('data:'))
      ? product.image
      : `http://localhost:8000${product.image}`
    : '/placeholder-fish.svg';

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="detail-skeleton">
          <div className="skeleton-img" />
          <div className="skeleton-info">
            <div className="skeleton-line wide" />
            <div className="skeleton-line medium" />
            <div className="skeleton-line narrow" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-page">
        <div className="detail-error">
          <h2>Product Not Found</h2>
          <p>The product you are looking for does not exist or has been removed.</p>
          <Link to="/shop" className="btn-back">Back to Shop</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/shop">Shop</Link>
        <span>/</span>
        <span>{product.name}</span>
      </div>

      <div className="product-detail">
        <div className="detail-image-col">
          <div className="detail-image-wrap">
            <img
              src={imageSrc}
              alt={product.name}
              className="detail-image"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-fish.svg';
              }}
            />
          </div>
        </div>

        <div className="detail-info-col">
          <p className="detail-category">{product.category?.name}</p>
          <h1 className="detail-name">{product.name}</h1>

          <div className="detail-price-row">
            <span className="detail-price">₹{Number(product.price).toFixed(2)}</span>
            <span className={`detail-availability ${product.available ? 'in-stock' : 'out-of-stock'}`}>
              {product.available ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          <div className="detail-description">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>

          {product.available && (
            <>
              <div className="qty-selector">
                <label>Quantity</label>
                <div className="qty-controls">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span>{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
                <p className="stock-note">{product.stock} available</p>
              </div>

              <div className="detail-actions">
                <button className="btn-add-cart" onClick={handleAddToCart}>
                  Add to Cart
                </button>
                <button className="btn-buy-now" onClick={handleBuyNow}>
                  Buy Now
                </button>
              </div>

              {addedMsg && (
                <div className="added-notice">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {addedMsg}
                </div>
              )}
            </>
          )}

          {!product.available && (
            <div className="out-of-stock-msg">
              This fish is currently not available. Please check back later.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
