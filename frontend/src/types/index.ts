export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Product {
  id: string;
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
  id: string;
  name: string;
  email: string;
  is_admin?: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  product_id: string;
  quantity: number;
}

export interface Order {
  id: string;
  user_id: string;
  items: OrderItemDetail[];
  total_amount: number;
  status: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  created_at: string;
}

export interface OrderItemDetail {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  image_url?: string;
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
  page?: number;
  page_size?: number;
}
