import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../../lib/api'
import type { Order } from '../../types'
import { RefreshCw, Scale, Clock, User, Truck } from 'lucide-react'
import clsx from 'clsx'

export default function WeighingPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const fetchQueue = () => {
    setLoading(true)
    adminApi.getWeighingQueue()
      .then((r) => setOrders(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchQueue() }, [])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-800 flex items-center gap-2">
            <Scale size={26} className="text-orange-500" />
            תור שקילה
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">הזמנות הממתינות להכנה ושקילה</p>
        </div>
        <button onClick={fetchQueue} className="p-2 hover:bg-gray-100 rounded-xl">
          <RefreshCw size={18} className={clsx('text-gray-500', loading && 'animate-spin')} />
        </button>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-400">טוען תור שקילה...</div>
      ) : orders.length === 0 ? (
        <div className="card p-16 text-center">
          <Scale size={56} className="text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-400">אין הזמנות לשקילה</p>
          <p className="text-sm text-gray-300 mt-1">כל ההזמנות טופלו ✓</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-orange-600 font-semibold">{orders.length} הזמנות ממתינות</p>
          {orders.map((order, idx) => {
            const weighedCount = order.items.filter((i) => i.is_weighed).length
            const totalItems = order.items.length
            const progress = totalItems > 0 ? (weighedCount / totalItems) * 100 : 0

            return (
              <Link
                key={order.id}
                to={`/admin/weigh/${order.id}`}
                className="card p-5 block hover:shadow-md transition-all hover:border-orange-300 border-2 border-transparent"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Priority number */}
                  <div className="w-10 h-10 bg-orange-100 text-orange-700 rounded-xl flex items-center justify-center font-bold text-lg shrink-0">
                    {idx + 1}
                  </div>

                  <div className="flex-1">
                    {/* Order number & status */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-dark-800 text-base">{order.order_number}</span>
                      <span className={clsx(
                        'badge text-xs',
                        order.status === 'new' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                      )}>
                        {order.status === 'new' ? 'חדש' : 'בהכנה'}
                      </span>
                    </div>

                    {/* Customer */}
                    <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <User size={13} />
                        {order.customer_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Truck size={13} />
                        {order.delivery_type === 'pickup' ? 'איסוף' : 'משלוח'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={13} />
                        {new Date(order.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Items list */}
                    <div className="mt-2 space-y-0.5">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 text-sm">
                          <span className={clsx(
                            'w-4 h-4 rounded-full flex items-center justify-center text-xs shrink-0',
                            item.is_weighed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                          )}>
                            {item.is_weighed ? '✓' : '○'}
                          </span>
                          <span className="text-gray-700">{item.product_name_he}</span>
                          {item.pricing_type === 'per_kg' && (
                            <span className="text-gray-400 text-xs">
                              ({item.requested_weight_kg} ק"ג)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Progress bar */}
                    {weighedCount > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>נשקל {weighedCount}/{totalItems}</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="text-brand-600 font-bold text-xl shrink-0">←</div>
                </div>

                <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm">
                  <span className="text-gray-500">{totalItems} פריטים</span>
                  <span className="font-semibold text-brand-600">~₪{order.estimated_total.toFixed(2)}</span>
                  <span className="bg-orange-600 text-white text-xs px-3 py-1 rounded-lg font-semibold">
                    התחל שקילה →
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
