import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../../services/api';
import './Orders.css';

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  image_url?: string;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  created_at: string;
  items: OrderItem[];
}

const statusLabel: Record<string, { text: string; cls: string }> = {
  paid:    { text: 'Order Successful', cls: 'status--paid' },
  pending: { text: 'Payment Pending',  cls: 'status--pending' },
  failed:  { text: 'Order Failed',     cls: 'status--failed' },
};

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyOrders()
      .then(setOrders)
      .catch(() => setError('Failed to load orders.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="orders-state">Loading your orders…</div>;
  if (error)   return <div className="orders-state orders-state--error">{error}</div>;

  return (
    <div className="orders-page">
      <div className="orders-hero">
        <h1>My Orders</h1>
        <p>Track all your purchases in one place</p>
      </div>

      <div className="orders-wrap">
        {orders.length === 0 ? (
          <div className="orders-empty">
            <div className="orders-empty__icon">🐠</div>
            <p>No orders yet.</p>
            <Link to="/shop" className="orders-shop-btn">Go Shopping</Link>
          </div>
        ) : (
          orders.map(order => {
            const s = statusLabel[order.status] ?? { text: order.status, cls: 'status--pending' };
            return (
              <div key={order.id} className="order-card">
                <div className="order-card__header">
                  <div className="order-card__meta">
                    <span className="order-card__date">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </span>
                    <span className="order-card__id">#{order.id.slice(-8).toUpperCase()}</span>
                  </div>
                  <span className={`order-status ${s.cls}`}>{s.text}</span>
                </div>

                <div className="order-card__items">
                  {order.items.map((item, i) => (
                    <div key={i} className="order-item">
                      {item.image_url && (
                        <img src={item.image_url} alt={item.product_name} className="order-item__img" />
                      )}
                      <div className="order-item__info">
                        <span className="order-item__name">{item.product_name}</span>
                        <span className="order-item__qty">Qty: {item.quantity}</span>
                      </div>
                      <span className="order-item__price">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>

                <div className="order-card__footer">
                  {order.razorpay_payment_id && (
                    <span className="order-card__txn">Txn: {order.razorpay_payment_id}</span>
                  )}
                  <span className="order-card__total">Total: ₹{order.total_amount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Orders;
