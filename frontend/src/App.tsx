import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth'

// Store pages
import HomePage from './pages/store/HomePage'
import CheckoutPage from './pages/store/CheckoutPage'
import OrderSuccessPage from './pages/store/OrderSuccessPage'
import OrderTrackPage from './pages/store/OrderTrackPage'
import PaymentPage from './pages/store/PaymentPage'

// Admin pages
import AdminLoginPage from './pages/admin/LoginPage'
import AdminLayout from './components/admin/AdminLayout'
import DashboardPage from './pages/admin/DashboardPage'
import OrdersPage from './pages/admin/OrdersPage'
import ProductsPage from './pages/admin/ProductsPage'
import CategoriesPage from './pages/admin/CategoriesPage'
import CustomersPage from './pages/admin/CustomersPage'
import MessagesPage from './pages/admin/MessagesPage'
import ReportsPage from './pages/admin/ReportsPage'
import PromotionsPage from './pages/admin/PromotionsPage'
import SiteContentPage from './pages/admin/SiteContentPage'

// Station (weighing station — no auth required)
import StationPage from './pages/station/StationPage'
import StationWeighPage from './pages/station/StationWeighPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated()) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      {/* Customer Store */}
      <Route path="/" element={<HomePage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/order-success/:orderNumber" element={<OrderSuccessPage />} />
      <Route path="/track/:orderNumber" element={<OrderTrackPage />} />
      <Route path="/pay/:token" element={<PaymentPage />} />

      {/* Admin */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard"    element={<DashboardPage />} />
        <Route path="orders"       element={<OrdersPage />} />
        <Route path="products"     element={<ProductsPage />} />
        <Route path="categories"   element={<CategoriesPage />} />
        <Route path="customers"    element={<CustomersPage />} />
        <Route path="messages"     element={<MessagesPage />} />
        <Route path="reports"      element={<ReportsPage />} />
        <Route path="promotions"   element={<PromotionsPage />} />
        <Route path="site-content" element={<SiteContentPage />} />
      </Route>

      {/* Weighing Station — standalone, no auth */}
      <Route path="/station" element={<StationPage />} />
      <Route path="/station/weigh/:orderId" element={<StationWeighPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
