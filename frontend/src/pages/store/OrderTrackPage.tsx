import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { storeApi } from '../../lib/api'
import type { Order, OrderStatus } from '../../types'
import { ORDER_STATUS_HE, ORDER_STATUS_COLOR } from '../../types'
import clsx from 'clsx'

const STATUS_STEPS: OrderStatus[] = ['new', 'in_preparation', 'weighed', 'payment_pending', 'paid', 'delivered']

export default function OrderTrackPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!orderNumber) return
    storeApi.trackOrder(orderNumber)
      .then((r) => setOrder(r.data))
      .catch(() => setError('הזמנה לא נמצאה'))
      .finally(() => setLoading(false))
  }, [orderNumber])

  const activeStep = order ? STATUS_STEPS.indexOf(order.status as OrderStatus) : -1

  return (
    <div className="min-h-screen bg-brand-50 p-4">
      <div className="max-w-xl mx-auto">
        <Link to="/" className="text-brand-600 text-sm mb-4 block hover:underline">← חזרה לחנות</Link>

        <h1 className="text-2xl font-bold text-dark-800 mb-6">מעקב הזמנה</h1>

        {loading && <div className="card p-8 text-center text-gray-400">טוען...</div>}
        {error && <div className="card p-8 text-center text-red-500">{error}</div>}

        {order && (
          <div className="space-y-4">
            {/* Order number & status */}
            <div className="card p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">הזמנה מספר</p>
                <p className="text-xl font-bold text-dark-800">{order.order_number}</p>
              </div>
              <span className={clsx('badge text-sm px-3 py-1', ORDER_STATUS_COLOR[order.status])}>
                {ORDER_STATUS_HE[order.status]}
              </span>
            </div>

            {/* Progress steps */}
            {order.status !== 'cancelled' && (
              <div className="card p-5">
                <h3 className="font-semibold text-dark-800 mb-4">מצב הזמנה</h3>
                <div className="flex justify-between">
                  {STATUS_STEPS.map((step, i) => (
                    <div key={step} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={clsx(
                          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                          i <= activeStep ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-400'
                        )}
                      >
                        {i < activeStep ? '✓' : i + 1}
                      </div>
                      <p className="text-xs text-center text-gray-500 leading-tight px-1">
                        {ORDER_STATUS_HE[step]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment link */}
            {order.status === 'payment_pending' && order.payment_link && (
              <div className="card p-5 bg-purple-50 border border-purple-200">
                <h3 className="font-bold text-purple-800 mb-2">ממתין לתשלום</h3>
                <p className="text-sm text-purple-700 mb-3">
                  המוצרים נשקלו. המחיר הסופי: <strong>₪{order.final_total?.toFixed(2)}</strong>
                </p>
                <a
                  href={order.payment_link}
                  className="btn-primary block text-center bg-purple-600 hover:bg-purple-700"
                >
                  לתשלום →
                </a>
              </div>
            )}

            {/* Items */}
            <div className="card p-5">
              <h3 className="font-semibold text-dark-800 mb-3">פרטי הזמנה</h3>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm py-1.5 border-b border-gray-50">
                    <span className="text-gray-700">{item.product_name_he}</span>
                    <span className="font-medium">
                      {item.is_weighed
                        ? `₪${item.actual_price?.toFixed(2)} (${item.actual_weight_kg} ק"ג)`
                        : `~₪${item.estimated_price.toFixed(2)}`}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold mt-3 pt-2">
                <span>סה"כ {order.final_total != null ? 'סופי' : 'שערוך'}:</span>
                <span className="text-brand-600">
                  ₪{(order.final_total ?? order.estimated_total).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
