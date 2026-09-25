import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { createOrder, verifyPayment } from '../../services/api';
import type { ShippingInfo, RazorpayOptions } from '../../types';
import './Checkout.css';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout: React.FC = () => {
  const { items, total, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [shipping, setShipping] = useState<ShippingInfo>({
    name: user?.name || '',
    address: '',
    phone: '',
  });

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setShipping((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
      return;
    }

    if (!shipping.name.trim() || !shipping.address.trim() || !shipping.phone.trim()) {
      setError('Please fill in all shipping details.');
      return;
    }

    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    setError('');
    setProcessing(true);

    try {
      const orderItems = items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      }));

      const order = await createOrder(orderItems);

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError('Failed to load payment gateway. Please try again.');
        setProcessing(false);
        return;
      }

      const options: RazorpayOptions = {
        key: order.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: order.amount,
        currency: 'INR',
        name: 'Exotic Gills and Fins',
        description: 'Premium Fish Order',
        order_id: order.razorpay_order_id || '',
        handler: async (response) => {
          try {
            await verifyPayment({
              ...response,
              order_id: order.order_id,
            });
            clearCart();
            setSuccess(true);
          } catch {
            setError('Payment verification failed. Please contact support.');
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          name: shipping.name,
          contact: shipping.phone,
        },
        theme: {
          color: '#f97316',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail || 'Failed to create order. Please try again.');
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="checkout-page">
        <div className="checkout-success">
          <div className="success-icon">&#x2705;</div>
          <h2>Order Placed Successfully!</h2>
          <p>Thank you for your purchase! Your fish are on their way.</p>
          <p className="success-note">
            You will receive a confirmation email shortly with tracking details.
          </p>
          <button className="btn-go-home" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1 className="checkout-title">Checkout</h1>

        <div className="checkout-layout">
          <form className="checkout-form" onSubmit={handlePayNow}>
            <div className="form-section">
              <h3>Shipping Information</h3>

              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={shipping.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="address">Shipping Address</label>
                <textarea
                  id="address"
                  name="address"
                  placeholder="123 Main Street, City, State, ZIP"
                  value={shipping.address}
                  onChange={handleChange}
                  rows={3}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  placeholder="+1 (555) 000-0000"
                  value={shipping.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="checkout-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              className={`pay-now-btn ${processing ? 'processing' : ''}`}
              disabled={processing}
            >
              {processing ? (
                <span className="spinner" />
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                  Pay Now — ₹{total.toFixed(2)}
                </>
              )}
            </button>

            <p className="secure-note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Secured by Razorpay
            </p>
          </form>

          <aside className="checkout-summary">
            <h3>Order Summary</h3>

            <div className="checkout-items">
              {items.map(({ product, quantity }) => {
                const imageSrc = product.image
                  ? (product.image.startsWith('http') || product.image.startsWith('data:'))
                    ? product.image
                    : `http://localhost:8000${product.image}`
                  : '/placeholder-fish.svg';

                return (
                  <div key={product.id} className="checkout-item">
                    <img
                      src={imageSrc}
                      alt={product.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-fish.svg';
                      }}
                    />
                    <div className="checkout-item-info">
                      <p className="checkout-item-name">{product.name}</p>
                      <p className="checkout-item-qty">Qty: {quantity}</p>
                    </div>
                    <span className="checkout-item-price">
                      ₹{(Number(product.price) * quantity).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="checkout-total-row">
              <span>Subtotal</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            <div className="checkout-total-row">
              <span>Shipping</span>
              <span className="shipping-note">Overnight delivery</span>
            </div>
            <div className="checkout-grand-total">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
