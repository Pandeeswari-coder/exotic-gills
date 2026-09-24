import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CartItem, Product } from '../types';
import { getLocalProducts } from '../services/localProductStore';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQty: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const cartKey = (userId?: string) =>
  userId ? `aquafin_cart_${userId}` : 'aquafin_cart_guest';

const syncWithStore = (items: CartItem[]): CartItem[] => {
  const localProds = getLocalProducts();
  return items
    .map(item => {
      const current = localProds.find(p => p.id === item.product.id);
      if (!current) return item;
      if (!current.available) return null;
      return { ...item, product: current };
    })
    .filter(Boolean) as CartItem[];
};

const loadCart = (userId?: string): CartItem[] => {
  try {
    const stored = localStorage.getItem(cartKey(userId));
    const parsed: CartItem[] = stored ? JSON.parse(stored) : [];
    return syncWithStore(parsed);
  } catch {
    return [];
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id;

  const [items, setItems] = useState<CartItem[]>(() => loadCart(userId));

  // Reload cart whenever the logged-in user changes (login / logout)
  useEffect(() => {
    setItems(loadCart(userId));
  }, [userId]);

  useEffect(() => {
    localStorage.setItem(cartKey(userId), JSON.stringify(items));
  }, [items, userId]);

  const addToCart = (product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQty = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem(cartKey(userId));
  };

  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQty, clearCart, total, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
