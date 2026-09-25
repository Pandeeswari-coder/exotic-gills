import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getWishlistIds, addToWishlist, removeFromWishlist } from '../services/api';

interface WishlistContextType {
  wishlist: string[];          // product IDs
  toggle: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  count: number;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType>({
  wishlist: [],
  toggle: async () => {},
  isWishlisted: () => false,
  count: 0,
  loading: false,
});

const LOCAL_KEY = 'egf_wishlist';

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load wishlist — DB when logged in, localStorage for guests
  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      getWishlistIds()
        .then(ids => setWishlist(ids))
        .catch(() => setWishlist([]))
        .finally(() => setLoading(false));
    } else {
      try {
        setWishlist(JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'));
      } catch {
        setWishlist([]);
      }
    }
  }, [isAuthenticated]);

  // Persist guest wishlist to localStorage
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(wishlist));
    }
  }, [wishlist, isAuthenticated]);

  const toggle = useCallback(async (productId: string) => {
    const already = wishlist.includes(productId);
    // Optimistic update
    setWishlist(prev =>
      already ? prev.filter(id => id !== productId) : [...prev, productId]
    );
    if (isAuthenticated) {
      try {
        if (already) {
          await removeFromWishlist(productId);
        } else {
          await addToWishlist(productId);
        }
      } catch {
        // Rollback on error
        setWishlist(prev =>
          already ? [...prev, productId] : prev.filter(id => id !== productId)
        );
      }
    }
  }, [wishlist, isAuthenticated]);

  const isWishlisted = useCallback((productId: string) => wishlist.includes(productId), [wishlist]);

  return (
    <WishlistContext.Provider value={{ wishlist, toggle, isWishlisted, count: wishlist.length, loading }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
