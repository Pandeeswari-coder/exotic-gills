export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  available: boolean;
  image: string;
  category: Category;
  created_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  product_id: number;
  quantity: number;
}

export interface Order {
  id: number;
  user: User;
  items: OrderItem[];
  total: number;
  status: string;
  shipping_name: string;
  shipping_address: string;
  shipping_phone: string;
  razorpay_order_id?: string;
  created_at: string;
}

export interface ShippingInfo {
  name: string;
  address: string;
  phone: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    contact: string;
  };
  theme: {
    color: string;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface ProductQueryParams {
  category?: string;
  min_price?: number;
  max_price?: number;
  available?: boolean;
  search?: string;
}
