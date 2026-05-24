import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Attach admin token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('buffalo_admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-redirect on 401
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('buffalo_admin_token')
      localStorage.removeItem('buffalo_admin_user')
      if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login'
      }
    }
    return Promise.reject(error)
  }
)

// ── Store API ──────────────────────────────────────────────────────────────────
export const storeApi = {
  getCategories: () => api.get('/categories'),
  getProducts: (categorySlug?: string) =>
    api.get('/products', { params: categorySlug ? { category_slug: categorySlug } : {} }),
  getProduct: (id: string) => api.get(`/products/${id}`),
  trackOrder: (orderNumber: string) => api.get(`/orders/track/${orderNumber}`),
  checkout: (data: unknown) => api.post('/orders/checkout', data),
}

// ── Admin API ──────────────────────────────────────────────────────────────────
export const adminApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  // Orders
  getOrders: (status?: string) =>
    api.get('/orders/admin/all', { params: status ? { status } : {} }),
  getOrder: (id: string) => api.get(`/orders/admin/${id}`),
  updateOrderStatus: (id: string, status: string, adminNotes?: string) =>
    api.patch(`/orders/admin/${id}/status`, { status, admin_notes: adminNotes }),

  // Weighing
  getWeighingQueue: () => api.get('/weigh/queue'),
  getOrderForWeighing: (id: string) => api.get(`/weigh/${id}`),
  startPreparation: (id: string) => api.post(`/weigh/${id}/start`),
  weighItem: (orderId: string, itemId: string, actualWeightKg: number) =>
    api.post(`/weigh/${orderId}/item/${itemId}`, { actual_weight_kg: actualWeightKg }),
  completeWeighing: (orderId: string, items: Array<{item_id: string; actual_weight_kg: number}>) =>
    api.post(`/weigh/${orderId}/complete`, { items }),
  sendPaymentRequest: (orderId: string) => api.post(`/weigh/${orderId}/send-payment`),

  // Products
  getAdminProducts: () => api.get('/products/admin'),
  createProduct: (data: unknown) => api.post('/products', data),
  updateProduct: (id: string, data: unknown) => api.put(`/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/products/${id}`),

  // Categories
  getAllCategories: () => api.get('/categories/all'),
  createCategory: (data: unknown) => api.post('/categories', data),
  updateCategory: (id: string, data: unknown) => api.put(`/categories/${id}`, data),

  // Stats & Reports
  getStats: () => api.get('/admin/stats'),
  getDailyReport: (days?: number) => api.get('/admin/reports/daily', { params: { days } }),
  getBestSellers: () => api.get('/admin/reports/best-sellers'),

  // Promotions
  getPromotions: () => api.get('/admin/promotions'),
  createPromotion: (data: unknown) => api.post('/admin/promotions', data),
  deletePromotion: (id: string) => api.delete(`/admin/promotions/${id}`),

  // Banners
  getBanners: () => api.get('/admin/banners'),
  createBanner: (data: unknown) => api.post('/admin/banners', data),
  updateBanner: (id: string, data: unknown) => api.put(`/admin/banners/${id}`, data),
  deleteBanner: (id: string) => api.delete(`/admin/banners/${id}`),

  // Site Content (CMS)
  getSiteContent: () => api.get('/site-content/'),
  getSiteContentMap: () => api.get('/site-content/map'),
  updateSiteContent: (updates: Record<string, string>) =>
    api.put('/site-content/', { updates }),
}
