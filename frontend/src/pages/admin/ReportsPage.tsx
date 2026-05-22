import { useEffect, useState } from 'react'
import { adminApi } from '../../lib/api'
import { TrendingUp, Package, ShoppingBag } from 'lucide-react'

interface DailyReport {
  date: string
  total_orders: number
  completed_orders: number
  total_revenue: number
  avg_order_value: number
}

interface BestSeller {
  product_name: string
  order_count: number
  total_weight_kg: number
  total_revenue: number
}

export default function ReportsPage() {
  const [daily, setDaily] = useState<DailyReport[]>([])
  const [bestSellers, setBestSellers] = useState<BestSeller[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([adminApi.getDailyReport(30), adminApi.getBestSellers()])
      .then(([dailyRes, bsRes]) => {
        setDaily(dailyRes.data.slice(-14).reverse()) // last 14 days
        setBestSellers(bsRes.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const totalRevenue = daily.reduce((s, d) => s + d.total_revenue, 0)
  const totalOrders = daily.reduce((s, d) => s + d.total_orders, 0)

  if (loading) return <div className="text-center py-20 text-gray-400">טוען דוחות...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dark-800">דוחות ונתונים</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500">הכנסה (14 יום)</p>
          <p className="text-2xl font-bold text-green-600 mt-1">₪{totalRevenue.toFixed(0)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">הזמנות (14 יום)</p>
          <p className="text-2xl font-bold text-brand-600 mt-1">{totalOrders}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">ממוצע להזמנה</p>
          <p className="text-2xl font-bold text-dark-800 mt-1">
            ₪{totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(0) : 0}
          </p>
        </div>
      </div>

      {/* Daily table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-bold text-dark-800 flex items-center gap-2">
            <TrendingUp size={18} />
            הכנסות יומיות
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-right px-4 py-2 font-medium text-gray-600">תאריך</th>
                <th className="text-right px-4 py-2 font-medium text-gray-600">הזמנות</th>
                <th className="text-right px-4 py-2 font-medium text-gray-600">הושלמו</th>
                <th className="text-right px-4 py-2 font-medium text-gray-600">הכנסה</th>
                <th className="text-right px-4 py-2 font-medium text-gray-600">ממוצע</th>
              </tr>
            </thead>
            <tbody>
              {daily.map((row) => (
                <tr key={row.date} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-700">
                    {new Date(row.date).toLocaleDateString('he-IL', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-4 py-2.5">{row.total_orders}</td>
                  <td className="px-4 py-2.5 text-green-600">{row.completed_orders}</td>
                  <td className="px-4 py-2.5 font-semibold text-brand-600">
                    {row.total_revenue > 0 ? `₪${row.total_revenue.toFixed(0)}` : '-'}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">
                    {row.avg_order_value > 0 ? `₪${row.avg_order_value.toFixed(0)}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Best sellers */}
      {bestSellers.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-bold text-dark-800 flex items-center gap-2">
              <Package size={18} />
              מוצרים מובילים (30 יום)
            </h2>
          </div>
          <div className="divide-y">
            {bestSellers.slice(0, 10).map((item, i) => (
              <div key={item.product_name} className="px-4 py-3 flex items-center gap-3">
                <span className="w-6 h-6 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-dark-800 text-sm">{item.product_name}</p>
                  <p className="text-xs text-gray-500">{item.order_count} הזמנות · {item.total_weight_kg.toFixed(1)} ק"ג</p>
                </div>
                <p className="font-bold text-brand-600">₪{item.total_revenue.toFixed(0)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
