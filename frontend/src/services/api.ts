import axios from 'axios';
import type {
  Product,
  Category,
  AuthResponse,
  Order,
  OrderItem,
  ProductQueryParams,
  RazorpayResponse,
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export const getProducts = async (params?: ProductQueryParams): Promise<Product[]> => {
  const response = await api.get('/products', { params });
  // Backend returns paginated { items, total, page, ... } — extract items array
  return response.data?.items ?? response.data;
};

export const getProduct = async (id: number | string): Promise<Product> => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get('/categories');
  return response.data;
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (data: {
  full_name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

export const createOrder = async (
  items: OrderItem[],
): Promise<{ razorpay_order_id: string; amount: number; currency: string; order_id: string; key_id: string }> => {
  const response = await api.post('/orders/create', { items });
  return response.data;
};

export const verifyPayment = async (data: RazorpayResponse & { order_id: string }): Promise<Order> => {
  const response = await api.post('/orders/verify', data);
  return response.data;
};

export const getMyOrders = async (): Promise<Order[]> => {
  const response = await api.get('/orders/my-orders');
  return response.data;
};

/* ── Admin product management ── */
export const createProduct = async (data: FormData): Promise<Product> => {
  const response = await api.post('/products', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateProduct = async (id: string, data: FormData): Promise<Product> => {
  const response = await api.patch(`/products/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  await api.delete(`/products/${id}`);
};

/* ── Wishlist ── */
export const getWishlist = async (): Promise<Product[]> => {
  const response = await api.get('/wishlist');
  return response.data;
};

export const getWishlistIds = async (): Promise<string[]> => {
  const response = await api.get('/wishlist/ids');
  return response.data.product_ids;
};

export const addToWishlist = async (productId: string): Promise<void> => {
  await api.post(`/wishlist/${productId}`);
};

export const removeFromWishlist = async (productId: string): Promise<void> => {
  await api.delete(`/wishlist/${productId}`);
};

export default api;
