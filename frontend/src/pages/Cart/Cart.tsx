import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './Cart.css';

const Cart: React.FC = () => {
  const { items, removeFromCart, updateQty, total, clearCart } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-empty">
          <span className="cart-empty-icon">&#x1F6D2;</span>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added any fish yet!</p>
          <Link to="/shop" className="btn-shop">Browse Fish</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        <div className="cart-header">
          <h1>Shopping Cart</h1>
          <button className="clear-cart-btn" onClick={clearCart}>
            Clear Cart
          </button>
        </div>

        <div className="cart-layout">
          <div className="cart-items">
            {items.map(({ product, quantity }) => {
              const imageSrc = product.image
                ? (product.image.startsWith('http') || product.image.startsWith('data:'))
                  ? product.image
                  : `http://localhost:8000${product.image}`
                : '/placeholder-fish.svg';

              return (
                <div key={product.id} className="cart-item">
                  <div className="cart-item__image">
                    <img
                      src={imageSrc}
                      alt={product.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-fish.svg';
                      }}
                    />
                  </div>

                  <div className="cart-item__info">
                    <p className="cart-item__category">{product.category?.name}</p>
                    <h3 className="cart-item__name">{product.name}</h3>
                    <p className="cart-item__unit-price">₹{Number(product.price).toFixed(2)} each</p>
                  </div>

                  <div className="cart-item__qty">
                    <button
                      onClick={() => updateQty(product.id, quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span>{quantity}</span>
                    <button
                      onClick={() => updateQty(product.id, quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <div className="cart-item__subtotal">
                    ₹{(Number(product.price) * quantity).toFixed(2)}
                  </div>

                  <button
                    className="cart-item__remove"
                    onClick={() => removeFromCart(product.id)}
                    aria-label="Remove item"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>

          <aside className="cart-summary">
            <h3>Order Summary</h3>

            <div className="summary-rows">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="summary-row">
                  <span>{product.name} x{quantity}</span>
                  <span>₹{(Number(product.price) * quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="summary-divider" />

            <div className="summary-total">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>

            <button
              className="checkout-btn"
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout
            </button>

            <Link to="/shop" className="continue-shopping">
              Continue Shopping
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Cart;
