import { useEffect, useState } from 'react'
import { adminApi } from '../../lib/api'
import { Link } from 'react-router-dom'
import {
  ShoppingBag, Scale, CreditCard,
  TrendingUp, Clock,
} from 'lucide-react'
import type { DashboardStats } from '../../types'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getStats()
      .then((r) => setStats(r.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-20 text-gray-400">טוען...</div>

  const statCards = stats ? [
    { label: 'הזמנות היום', value: stats.today_orders, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'הכנסה היום', value: `₪${stats.today_revenue.toFixed(2)}`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'ממתינות לשקילה', value: stats.in_preparation, icon: Scale, color: 'text-orange-600', bg: 'bg-orange-50', alert: stats.in_preparation > 0 },
    { label: 'ממתינות לתשלום', value: stats.awaiting_payment, icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50', alert: stats.awaiting_payment > 0 },
    { label: 'הזמנות חדשות', value: stats.pending_orders, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  ] : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-800">לוח בקרה</h1>
        <p className="text-sm text-gray-500">{new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className={`card p-4 relative ${card.alert ? 'ring-2 ring-orange-400' : ''}`}>
            {card.alert && (
              <span className="absolute top-2 left-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
              <card.icon size={20} className={card.color} />
            </div>
            <p className="text-2xl font-bold text-dark-800">{card.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weighing queue CTA */}
        {stats && stats.in_preparation > 0 && (
          <Link to="/admin/weigh" className="card p-6 bg-gradient-to-l from-orange-50 to-red-50 border-orange-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center">
                <Scale size={28} className="text-orange-600" />
              </div>
              <div>
                <p className="font-bold text-dark-800 text-lg">
                  {stats.in_preparation} הזמנות לשקילה
                </p>
                <p className="text-sm text-orange-600">לחץ להתחיל שקילה →</p>
              </div>
            </div>
          </Link>
        )}

        {/* Payment pending CTA */}
        {stats && stats.awaiting_payment > 0 && (
          <Link to="/admin/orders?status=payment_pending" className="card p-6 bg-gradient-to-l from-purple-50 to-pink-50 border-purple-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center">
                <CreditCard size={28} className="text-purple-600" />
              </div>
              <div>
                <p className="font-bold text-dark-800 text-lg">
                  {stats.awaiting_payment} ממתינות לתשלום
                </p>
                <p className="text-sm text-purple-600">צפה בהזמנות →</p>
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  )
}
