import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingBag, Package,
  BarChart3, Tag, LogOut, Menu, X, Globe,
  Users, MessageCircle, Layers, Scale, ExternalLink,
} from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../../store/auth'
import clsx from 'clsx'

const NAV_ITEMS = [
  { to: '/admin/dashboard',    icon: LayoutDashboard, label: 'לוח בקרה' },
  { to: '/admin/orders',       icon: ShoppingBag,     label: 'הזמנות' },
  { to: '/admin/products',     icon: Package,         label: 'מוצרים' },
  { to: '/admin/categories',   icon: Layers,          label: 'קטגוריות' },
  { to: '/admin/customers',    icon: Users,           label: 'לקוחות' },
  { to: '/admin/messages',     icon: MessageCircle,   label: 'הודעות WhatsApp' },
  { to: '/admin/promotions',   icon: Tag,             label: 'מבצעים' },
  { to: '/admin/reports',      icon: BarChart3,       label: 'דוחות' },
  { to: '/admin/site-content', icon: Globe,           label: 'תוכן האתר' },
]

export default function AdminLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex" dir="rtl">
      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 right-0 z-50 w-64 bg-dark-800 text-white flex flex-col transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : 'translate-x-full',
          'md:relative md:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="p-5 border-b border-dark-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center font-bold text-lg">B</div>
            <div>
              <p className="font-bold">באפלו מיטליז</p>
              <p className="text-xs text-brand-300">פאנל ניהול</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">שלום, {user?.full_name}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm',
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-300 hover:bg-dark-700 hover:text-white'
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Station shortcut + Logout */}
        <div className="p-3 border-t border-dark-700 space-y-1">
          <a
            href="/station"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-orange-300 hover:bg-orange-900/30 hover:text-orange-200 transition-all text-sm font-medium"
          >
            <Scale size={18} />
            עמדת שקילה
            <ExternalLink size={12} className="mr-auto opacity-60" />
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-gray-400 hover:bg-dark-700 hover:text-red-400 transition-all text-sm"
          >
            <LogOut size={18} />
            יציאה
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between md:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu size={24} className="text-gray-600" />
          </button>
          <span className="font-bold text-dark-800">באפלו מיטליז - ניהול</span>
          <button onClick={() => setSidebarOpen(false)}>
            <X size={24} className="text-gray-600 opacity-0 pointer-events-none" />
          </button>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
