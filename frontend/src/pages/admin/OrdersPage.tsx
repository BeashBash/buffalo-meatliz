import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { adminApi } from '../../lib/api'
import type { Order, OrderStatus } from '../../types'
import { ORDER_STATUS_HE, ORDER_STATUS_COLOR } from '../../types'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import { Scale, Eye, RefreshCw } from 'lucide-react'

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: '', label: 'הכל' },
  { value: 'new', label: 'חדש' },
  { value: 'in_preparation', label: 'בהכנה' },
  { value: 'weighed', label: 'נשקל' },
  { value: 'payment_pending', label: 'ממתין לתשלום' },
  { value: 'paid', label: 'שולם' },
  { value: 'delivered', label: 'נמסר' },
]

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeStatus = searchParams.get('status') || ''
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Order | null>(null)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const { data } = await adminApi.getOrders(activeStatus || undefined)
      setOrders(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrders() }, [activeStatus])

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { data } = await adminApi.updateOrderStatus(orderId, newStatus)
      setOrders((prev) => prev.map((o) => (o.id === orderId ? data : o)))
      if (selected?.id === orderId) setSelected(data)
      toast.success('הסטטוס עודכן')
    } catch {
      toast.error('שגיאה בעדכון סטטוס')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-800">הזמנות</h1>
        <button onClick={fetchOrders} className="p-2 hover:bg-gray-100 rounded-xl">
          <RefreshCw size={18} className="text-gray-500" />
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setSearchParams(f.value ? { status: f.value } : {})}
            className={clsx(
              'shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              activeStatus === f.value
                ? 'bg-brand-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders table */}
      {loading ? (
        <div className="card p-8 text-center text-gray-400">טוען...</div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">אין הזמנות</div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-dark-800">{order.order_number}</span>
                    <span className={clsx('badge', ORDER_STATUS_COLOR[order.status])}>
                      {ORDER_STATUS_HE[order.status]}
                    </span>
                    {order.delivery_type === 'pickup' && (
                      <span className="badge bg-gray-100 text-gray-600">איסוף עצמי</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{order.customer_name} · {order.customer_phone}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(order.created_at).toLocaleString('he-IL')}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-sm">
                    <span className="text-gray-500">{order.items.length} פריטים</span>
                    <span className="text-brand-600 font-semibold">
                      {order.final_total != null
                        ? `₪${order.final_total.toFixed(2)}`
                        : `~₪${order.estimated_total.toFixed(2)}`}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  {(order.status === 'new' || order.status === 'in_preparation') && (
                    <Link
                      to={`/admin/weigh/${order.id}`}
                      className="flex items-center gap-1.5 bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-orange-200 transition-colors"
                    >
                      <Scale size={14} />
                      שקילה
                    </Link>
                  )}
                  <button
                    onClick={() => setSelected(selected?.id === order.id ? null : order)}
                    className="flex items-center gap-1.5 bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Eye size={14} />
                    פרטים
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {selected?.id === order.id && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  {/* Items */}
                  <div className="space-y-1.5">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm bg-gray-50 rounded-lg p-2">
                        <span className="text-gray-700">{item.product_name_he}</span>
                        <span className="font-medium text-dark-800">
                          {item.is_weighed
                            ? `₪${item.actual_price?.toFixed(2)} (${item.actual_weight_kg} ק"ג)`
                            : `~₪${item.estimated_price.toFixed(2)}`
                          }
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Status changer */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500">שנה סטטוס:</span>
                    {['in_preparation', 'paid', 'delivered', 'cancelled'].map((s) => (
                      order.status !== s && (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(order.id, s)}
                          className={clsx('text-xs px-2.5 py-1 rounded-lg border transition-colors hover:opacity-80', ORDER_STATUS_COLOR[s as OrderStatus])}
                        >
                          {ORDER_STATUS_HE[s as OrderStatus]}
                        </button>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
