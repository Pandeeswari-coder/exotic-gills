import React from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.available) addToCart(product, 1);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product.id);
  };

  const imageSrc = product.image
    ? (product.image.startsWith('http') || product.image.startsWith('data:'))
      ? product.image
      : `http://localhost:8000${product.image}`
    : '/placeholder-fish.svg';

  return (
    <Link to={`/product/${product.id}`} className="product-card">
      <div className="product-card__image-wrap">
        <img
          src={imageSrc}
          alt={product.name}
          className="product-card__image"
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-fish.svg'; }}
        />

        {/* Wishlist heart */}
        <button
          className={`product-card__wishlist${wishlisted ? ' wishlisted' : ''}`}
          onClick={handleWishlist}
          title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {wishlisted ? '♥' : '♡'}
        </button>

        {/* Sold-out overlay */}
        {!product.available && (
          <div className="product-card__out-overlay">
            <span>Sold Out</span>
          </div>
        )}
      </div>

      <div className="product-card__body">
        {product.category?.name && (
          <p className="product-card__category">{product.category.name}</p>
        )}
        <h3 className="product-card__name">{product.name}</h3>
        <p className="product-card__price">₹{Number(product.price).toFixed(2)}</p>

        <button
          className={`product-card__btn ${!product.available ? 'disabled' : ''}`}
          onClick={handleAddToCart}
          disabled={!product.available}
        >
          {product.available ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </Link>
  );
};

export default ProductCard;
