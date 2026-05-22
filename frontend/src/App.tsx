import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth'

// Store pages
import HomePage from './pages/store/HomePage'
import CheckoutPage from './pages/store/CheckoutPage'
import OrderSuccessPage from './pages/store/OrderSuccessPage'
import OrderTrackPage from './pages/store/OrderTrackPage'

// Admin pages
import AdminLoginPage from './pages/admin/LoginPage'
import AdminLayout from './components/admin/AdminLayout'
import DashboardPage from './pages/admin/DashboardPage'
import OrdersPage from './pages/admin/OrdersPage'
import WeighingPage from './pages/admin/WeighingPage'
import WeighOrderPage from './pages/admin/WeighOrderPage'
import ProductsPage from './pages/admin/ProductsPage'
import ReportsPage from './pages/admin/ReportsPage'
import PromotionsPage from './pages/admin/PromotionsPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated()) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      {/* ── Customer Store ── */}
      <Route path="/" element={<HomePage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/order-success/:orderNumber" element={<OrderSuccessPage />} />
      <Route path="/track/:orderNumber" element={<OrderTrackPage />} />

      {/* ── Admin ── */}
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
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="weigh" element={<WeighingPage />} />
        <Route path="weigh/:orderId" element={<WeighOrderPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="promotions" element={<PromotionsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
