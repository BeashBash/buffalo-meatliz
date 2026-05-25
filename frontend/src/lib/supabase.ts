/**
 * Supabase REST client — uses RPC functions to access buffalo schema.
 * No npm package needed, no backend needed.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const ANON_KEY    = import.meta.env.VITE_SUPABASE_ANON_KEY as string

function hdrs(): Record<string, string> {
  return {
    apikey:          ANON_KEY,
    Authorization:   `Bearer ${ANON_KEY}`,
    'Content-Type':  'application/json',
    'Accept':        'application/json',
  }
}

export interface SiteContentRow {
  key:     string
  value:   string | null
  type:    string
  section: string
  label:   string
}

/** Fetch all rows via RPC (bypasses schema restriction) */
export async function fetchSiteContent(): Promise<SiteContentRow[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_site_content`, {
    method:  'POST',
    headers: hdrs(),
    body:    '{}',
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`${res.status}: ${txt}`)
  }
  return res.json()
}

/** Returns a flat key → value map */
export async function fetchSiteContentMap(): Promise<Record<string, string>> {
  const rows = await fetchSiteContent()
  return Object.fromEntries(rows.map(r => [r.key, r.value ?? '']))
}

/** Update a single key via RPC */
export async function updateSiteContentKey(key: string, value: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/update_site_content`, {
    method:  'POST',
    headers: hdrs(),
    body:    JSON.stringify({ p_key: key, p_value: value }),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`${res.status}: ${txt}`)
  }
}

/** Bulk update — all patches in parallel */
export async function bulkUpdateSiteContent(updates: Record<string, string>): Promise<void> {
  await Promise.all(
    Object.entries(updates).map(([key, value]) => updateSiteContentKey(key, value))
  )
}

// ── Catalog types ──────────────────────────────────────────────────────────

export interface Category {
  id: string
  name_he: string
  slug: string
  description_he: string | null
  image_url: string | null
  sort_order: number
  is_active: boolean
}

export interface Product {
  id: string
  category_id: string
  name_he: string
  slug: string
  description_he: string | null
  image_url: string | null
  pricing_type: 'per_kg' | 'per_unit'
  price: number
  min_weight_kg: number
  max_weight_kg: number
  weight_step_kg: number
  is_available: boolean
  is_featured: boolean
  badge: string | null
  sort_order: number
}

async function rpc<T>(fn: string, body: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method:  'POST',
    headers: hdrs(),
    body:    JSON.stringify(body),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Supabase RPC ${fn} error ${res.status}: ${txt}`)
  }
  return res.json()
}

/** Fetch all active categories */
export async function fetchCategories(): Promise<Category[]> {
  return rpc<Category[]>('get_categories')
}

/** Fetch all available products */
export async function fetchProducts(): Promise<Product[]> {
  return rpc<Product[]>('get_products')
}

/** Fetch products for a specific category slug */
export async function fetchProductsByCategory(slug: string): Promise<Product[]> {
  return rpc<Product[]>('get_products_by_category', { p_slug: slug })
}

// ── Admin types ────────────────────────────────────────────────────────────

export interface AdminProduct extends Product {
  category_name: string | null
}

export interface AdminCategory {
  id: string
  name_he: string
  slug: string
  description_he: string | null
  image_url: string | null
  sort_order: number
  is_active: boolean
}

// ── Admin CRUD ─────────────────────────────────────────────────────────────

/** All products (including unavailable) with category name */
export async function adminGetProducts(): Promise<AdminProduct[]> {
  return rpc<AdminProduct[]>('admin_get_products')
}

/** All categories (including inactive) */
export async function adminGetCategories(): Promise<AdminCategory[]> {
  return rpc<AdminCategory[]>('admin_get_categories')
}

export interface CreateProductPayload {
  name_he: string
  category_id: string
  pricing_type: 'per_kg' | 'per_unit'
  price: number
  description_he?: string
  image_url?: string
  min_weight_kg?: number
  max_weight_kg?: number
  weight_step_kg?: number
  is_available?: boolean
  is_featured?: boolean
  badge?: string
  sort_order?: number
}

/** Create a new product — returns the created row */
export async function adminCreateProduct(payload: CreateProductPayload): Promise<AdminProduct> {
  const rows = await rpc<AdminProduct[]>('admin_create_product', {
    p_name_he:        payload.name_he,
    p_category_id:    payload.category_id || null,
    p_pricing_type:   payload.pricing_type,
    p_price:          payload.price,
    p_description_he: payload.description_he ?? null,
    p_image_url:      payload.image_url ?? null,
    p_min_weight_kg:  payload.min_weight_kg ?? 0.5,
    p_max_weight_kg:  payload.max_weight_kg ?? 10,
    p_weight_step_kg: payload.weight_step_kg ?? 0.5,
    p_is_available:   payload.is_available ?? true,
    p_is_featured:    payload.is_featured ?? false,
    p_badge:          payload.badge ?? null,
    p_sort_order:     payload.sort_order ?? 0,
  })
  return rows[0]
}

/** Update an existing product — pass only fields to change */
export async function adminUpdateProduct(
  id: string,
  payload: Partial<CreateProductPayload>
): Promise<AdminProduct> {
  const rows = await rpc<AdminProduct[]>('admin_update_product', {
    p_id:             id,
    p_name_he:        payload.name_he        ?? null,
    p_category_id:    payload.category_id    ?? null,
    p_pricing_type:   payload.pricing_type   ?? null,
    p_price:          payload.price          ?? null,
    p_description_he: payload.description_he ?? null,
    p_image_url:      payload.image_url      ?? null,
    p_min_weight_kg:  payload.min_weight_kg  ?? null,
    p_max_weight_kg:  payload.max_weight_kg  ?? null,
    p_weight_step_kg: payload.weight_step_kg ?? null,
    p_is_available:   payload.is_available   ?? null,
    p_is_featured:    payload.is_featured    ?? null,
    p_badge:          payload.badge          ?? null,
    p_sort_order:     payload.sort_order     ?? null,
  })
  return rows[0]
}

/** Delete a product by ID */
export async function adminDeleteProduct(id: string): Promise<void> {
  await rpc<void>('admin_delete_product', { p_id: id })
}

// ── Customer types ─────────────────────────────────────────────────────────

export interface AdminCustomer {
  id: string
  full_name: string
  phone: string
  phone2: string | null
  email: string | null
  address: string | null
  apartment: string | null
  floor: string | null
  entry_code: string | null
  address_notes: string | null
  city: string | null
  preferred_contact_day: string | null
  internal_notes: string | null
  created_at: string
  order_count: number
  total_spent: number
  last_order_at: string | null
  last_order_total: number | null
}

export interface CustomerOrder {
  id: string
  order_number: string
  status: string
  estimated_total: number
  final_total: number | null
  delivery_type: string
  created_at: string
}

export async function adminGetCustomers(): Promise<AdminCustomer[]> {
  return rpc<AdminCustomer[]>('admin_get_customers')
}

export async function adminGetCustomerOrders(customerId: string): Promise<CustomerOrder[]> {
  return rpc<CustomerOrder[]>('admin_get_customer_orders', { p_customer_id: customerId })
}

// ── Message types ──────────────────────────────────────────────────────────

export interface MessageLog {
  id: string
  customer_id: string | null
  customer_name: string | null
  phone: string
  message: string
  channel: string
  sent_by: string | null
  created_at: string
}

export async function adminLogMessage(
  customerId: string | null,
  phone: string,
  message: string,
  channel: string = 'whatsapp'
): Promise<void> {
  await rpc<void>('admin_log_message', {
    p_customer_id: customerId,
    p_phone:       phone,
    p_message:     message,
    p_channel:     channel,
    p_sent_by:     'admin',
  })
}

export async function adminGetMessages(): Promise<MessageLog[]> {
  return rpc<MessageLog[]>('admin_get_messages')
}

// ── Category CRUD ──────────────────────────────────────────────────────────

export interface CreateCategoryPayload {
  name_he: string
  slug?: string
  description_he?: string
  image_url?: string
  sort_order?: number
  is_active?: boolean
}

export async function adminCreateCategory(payload: CreateCategoryPayload): Promise<AdminCategory> {
  const rows = await rpc<AdminCategory[]>('admin_create_category', {
    p_name_he:        payload.name_he,
    p_slug:           payload.slug           ?? null,
    p_description_he: payload.description_he ?? null,
    p_image_url:      payload.image_url      ?? null,
    p_sort_order:     payload.sort_order     ?? 0,
    p_is_active:      payload.is_active      ?? true,
  })
  return rows[0]
}

export async function adminUpdateCategory(
  id: string,
  payload: Partial<CreateCategoryPayload>
): Promise<AdminCategory> {
  const rows = await rpc<AdminCategory[]>('admin_update_category', {
    p_id:             id,
    p_name_he:        payload.name_he        ?? null,
    p_slug:           payload.slug           ?? null,
    p_description_he: payload.description_he ?? null,
    p_image_url:      payload.image_url      ?? null,
    p_sort_order:     payload.sort_order     ?? null,
    p_is_active:      payload.is_active      ?? null,
  })
  return rows[0]
}

export async function adminDeleteCategory(id: string): Promise<void> {
  await rpc<void>('admin_delete_category', { p_id: id })
}

// ── Customer update ────────────────────────────────────────────────────────

export interface UpdateCustomerPayload {
  full_name?: string
  phone?: string
  phone2?: string | null
  email?: string | null
  address?: string | null
  apartment?: string | null
  floor?: string | null
  entry_code?: string | null
  address_notes?: string | null
  city?: string | null
  preferred_contact_day?: string | null
  internal_notes?: string | null
}

export async function adminUpdateCustomer(id: string, p: UpdateCustomerPayload): Promise<void> {
  await rpc<void>('admin_update_customer', {
    p_id:                    id,
    p_full_name:             p.full_name             ?? null,
    p_phone:                 p.phone                 ?? null,
    p_phone2:                p.phone2                ?? null,
    p_email:                 p.email                 ?? null,
    p_address:               p.address               ?? null,
    p_apartment:             p.apartment             ?? null,
    p_floor:                 p.floor                 ?? null,
    p_entry_code:            p.entry_code            ?? null,
    p_address_notes:         p.address_notes         ?? null,
    p_city:                  p.city                  ?? null,
    p_preferred_contact_day: p.preferred_contact_day ?? null,
    p_internal_notes:        p.internal_notes        ?? null,
  })
}

// ── Station (weighing) types ────────────────────────────────────────────────

export interface StationOrderItem {
  id: string
  product_name_he: string
  pricing_type: 'per_kg' | 'per_unit'
  price_at_order: number
  quantity: number
  requested_weight_kg: number | null
  actual_weight_kg: number | null
  estimated_price: number
  actual_price: number | null
  is_weighed: boolean
  notes: string | null
}

export interface StationOrder {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  delivery_type: 'pickup' | 'delivery'
  delivery_address: string | null
  delivery_city: string | null
  preferred_delivery_time: string | null
  customer_notes: string | null
  status: string
  estimated_total: number
  final_total: number | null
  courier_name: string | null
  courier_phone: string | null
  created_at: string
  items: StationOrderItem[]
}

// ── Station RPCs ────────────────────────────────────────────────────────────

// PostgREST wraps scalar json returns as [{"fn_name": <value>}]
function unwrapRpc<T>(raw: unknown, fnName: string): T {
  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'object' && raw[0] !== null && fnName in raw[0]) {
    return (raw[0] as Record<string, unknown>)[fnName] as T
  }
  return raw as T
}

/** Orders waiting to be weighed (new / in_preparation) */
export async function stationGetQueue(): Promise<StationOrder[]> {
  const raw = await rpc<unknown>('station_get_queue')
  const result = unwrapRpc<StationOrder[] | null>(raw, 'station_get_queue')
  return result ?? []
}

/** Orders ready for delivery (weighed / payment_pending / paid) */
export async function stationGetReadyOrders(): Promise<StationOrder[]> {
  const raw = await rpc<unknown>('station_get_ready_orders')
  const result = unwrapRpc<StationOrder[] | null>(raw, 'station_get_ready_orders')
  return result ?? []
}

/** Single order with all item details */
export async function stationGetOrder(orderId: string): Promise<StationOrder> {
  const raw = await rpc<unknown>('station_get_order', { p_order_id: orderId })
  return unwrapRpc<StationOrder>(raw, 'station_get_order')
}

/** Move order from new to in_preparation */
export async function stationStartPreparation(orderId: string): Promise<void> {
  return rpc<void>('station_start_preparation', { p_order_id: orderId })
}

/** Weigh a single item and get updated order back */
export async function stationWeighItem(
  orderId: string,
  itemId: string,
  actualWeightKg: number
): Promise<StationOrder> {
  const raw = await rpc<unknown>('station_weigh_item', {
    p_order_id:         orderId,
    p_item_id:          itemId,
    p_actual_weight_kg: actualWeightKg,
  })
  return unwrapRpc<StationOrder>(raw, 'station_weigh_item')
}

/** Mark order as weighed, moves to weighed status */
export async function stationCompleteWeighing(orderId: string): Promise<void> {
  return rpc<void>('station_complete_weighing', { p_order_id: orderId })
}

/** Assign a courier (name + phone) to an order */
export async function stationAssignCourier(
  orderId: string,
  courierName: string,
  courierPhone: string
): Promise<void> {
  return rpc<void>('station_assign_courier', {
    p_order_id:      orderId,
    p_courier_name:  courierName,
    p_courier_phone: courierPhone,
  })
}
