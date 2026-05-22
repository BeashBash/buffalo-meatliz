export interface Category {
  id: string
  name_he: string
  slug: string
  description_he?: string
  image_url?: string
  sort_order: number
  is_active: boolean
}

export interface Product {
  id: string
  category_id?: string
  name_he: string
  slug: string
  description_he?: string
  image_url?: string
  pricing_type: 'per_kg' | 'per_unit'
  price: number
  min_weight_kg?: number
  max_weight_kg?: number
  weight_step_kg?: number
  is_available: boolean
  is_featured: boolean
  badge?: string
  sort_order: number
  category?: Category
}

export interface CartItem {
  product: Product
  // For per_kg
  requested_weight_kg?: number
  // For per_unit
  quantity: number
  estimated_price: number
}

export interface OrderItem {
  id: string
  product_id?: string
  product_name_he: string
  pricing_type: 'per_kg' | 'per_unit'
  price_at_order: number
  requested_weight_kg?: number
  actual_weight_kg?: number
  quantity: number
  estimated_price: number
  actual_price?: number
  is_weighed: boolean
  notes?: string
}

export type OrderStatus =
  | 'new'
  | 'in_preparation'
  | 'weighed'
  | 'payment_pending'
  | 'paid'
  | 'delivered'
  | 'cancelled'

export const ORDER_STATUS_HE: Record<OrderStatus, string> = {
  new: 'חדש',
  in_preparation: 'בהכנה',
  weighed: 'נשקל',
  payment_pending: 'ממתין לתשלום',
  paid: 'שולם',
  delivered: 'נמסר',
  cancelled: 'בוטל',
}

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  in_preparation: 'bg-yellow-100 text-yellow-800',
  weighed: 'bg-orange-100 text-orange-800',
  payment_pending: 'bg-purple-100 text-purple-800',
  paid: 'bg-green-100 text-green-800',
  delivered: 'bg-green-200 text-green-900',
  cancelled: 'bg-red-100 text-red-800',
}

export interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  delivery_type: 'delivery' | 'pickup'
  delivery_address?: string
  delivery_city?: string
  preferred_delivery_time?: string
  estimated_total: number
  final_total?: number
  discount_amount: number
  coupon_code?: string
  status: OrderStatus
  status_he: string
  customer_notes?: string
  admin_notes?: string
  payment_link?: string
  created_at: string
  updated_at: string
  weighed_at?: string
  paid_at?: string
  delivered_at?: string
  items: OrderItem[]
}

export interface CheckoutForm {
  customer_name: string
  customer_phone: string
  customer_email: string
  delivery_type: 'delivery' | 'pickup'
  delivery_address: string
  delivery_city: string
  preferred_delivery_time: string
  customer_notes: string
  coupon_code: string
}

export interface DashboardStats {
  today_orders: number
  today_revenue: number
  pending_orders: number
  in_preparation: number
  awaiting_weighing: number
  awaiting_payment: number
}

export interface AdminUser {
  admin_id: string
  full_name: string
  role: 'admin' | 'employee'
  access_token: string
}
