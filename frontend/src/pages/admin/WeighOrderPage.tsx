/**
 * WeighOrderPage — The CORE screen of the system.
 * Employee picks each item, enters actual weight, system recalculates total.
 * When all items are weighed → button to send payment request to customer.
 */
import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminApi } from '../../lib/api'
import type { Order, OrderItem } from '../../types'
import { Scale, CheckCircle, Send, ArrowRight, Phone, Truck, User } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

interface WeightInput {
  itemId: string
  value: string
  saved: boolean
}

export default function WeighOrderPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [weights, setWeights] = useState<Record<string, WeightInput>>({})
  const [savingItem, setSavingItem] = useState<string | null>(null)
  const [sendingPayment, setSendingPayment] = useState(false)
  const firstInputRef = useRef<HTMLInputElement>(null)

  const fetchOrder = async () => {
    if (!orderId) return
    setLoading(true)
    try {
      const { data } = await adminApi.getOrderForWeighing(orderId)
      setOrder(data)
      // Initialize weight inputs
      const initialWeights: Record<string, WeightInput> = {}
      data.items.forEach((item: OrderItem) => {
        initialWeights[item.id] = {
          itemId: item.id,
          value: item.actual_weight_kg?.toString() || item.requested_weight_kg?.toString() || '',
          saved: item.is_weighed,
        }
      })
      setWeights(initialWeights)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrder()
    // Auto-start preparation when opening weighing screen
    if (orderId) {
      adminApi.startPreparation(orderId).catch(() => {})
    }
  }, [orderId])

  useEffect(() => {
    // Focus first unweighed input
    setTimeout(() => firstInputRef.current?.focus(), 300)
  }, [loading])

  const handleWeightChange = (itemId: string, value: string) => {
    setWeights((prev) => ({ ...prev, [itemId]: { ...prev[itemId], value, saved: false } }))
  }

  const handleWeighItem = async (item: OrderItem) => {
    const weightStr = weights[item.id]?.value
    const weightNum = parseFloat(weightStr)
    if (!weightStr || isNaN(weightNum) || weightNum <= 0) {
      toast.error('הזן משקל תקין')
      return
    }

    setSavingItem(item.id)
    try {
      const { data } = await adminApi.weighItem(orderId!, item.id, weightNum)
      setOrder(data)
      setWeights((prev) => ({
        ...prev,
        [item.id]: { ...prev[item.id], saved: true },
      }))
      toast.success(`${item.product_name_he} נשקל ✓`)

      // Focus next unweighed item
      const items = data.items
      const nextItem = items.find((i: OrderItem) => !i.is_weighed)
      if (nextItem) {
        setTimeout(() => {
          document.getElementById(`weight-input-${nextItem.id}`)?.focus()
        }, 100)
      }
    } catch {
      toast.error('שגיאה בשמירת המשקל')
    } finally {
      setSavingItem(null)
    }
  }

  const handleSendPayment = async () => {
    if (!orderId) return
    setSendingPayment(true)
    try {
      await adminApi.sendPaymentRequest(orderId)
      toast.success('בקשת תשלום נשלחה ללקוח ✓')
      navigate('/admin/weigh')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'שגיאה בשליחת התשלום')
    } finally {
      setSendingPayment(false)
    }
  }

  const allWeighed = order?.items.every((i) => i.is_weighed) ?? false
  const weighedCount = order?.items.filter((i) => i.is_weighed).length ?? 0
  const totalItems = order?.items.length ?? 0
  const finalTotal = order?.final_total
  const estimatedTotal = order?.estimated_total

  if (loading) return <div className="text-center py-20 text-gray-400">טוען הזמנה...</div>
  if (!order) return <div className="text-center py-20 text-red-400">הזמנה לא נמצאה</div>

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-8">
      {/* Back */}
      <button
        onClick={() => navigate('/admin/weigh')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm"
      >
        <ArrowRight size={16} />
        חזרה לתור שקילה
      </button>

      {/* Order header */}
      <div className="card p-5 bg-gradient-to-l from-orange-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-dark-800">{order.order_number}</h1>
            <p className="text-sm text-gray-500 mt-0.5">שקילת הזמנה</p>
          </div>
          <div className="text-left">
            <p className="text-2xl font-bold text-orange-600">
              {weighedCount}/{totalItems}
            </p>
            <p className="text-xs text-gray-400">פריטים נשקלו</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-green-500 rounded-full transition-all duration-500"
              style={{ width: `${totalItems > 0 ? (weighedCount / totalItems) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Customer info */}
        <div className="mt-3 flex items-center gap-4 text-sm text-gray-600 flex-wrap">
          <span className="flex items-center gap-1">
            <User size={14} />
            {order.customer_name}
          </span>
          <a href={`tel:${order.customer_phone}`} className="flex items-center gap-1 text-brand-600 hover:underline">
            <Phone size={14} />
            {order.customer_phone}
          </a>
          <span className="flex items-center gap-1">
            <Truck size={14} />
            {order.delivery_type === 'pickup' ? 'איסוף עצמי' : `משלוח${order.delivery_city ? ` - ${order.delivery_city}` : ''}`}
          </span>
        </div>
        {order.customer_notes && (
          <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs text-yellow-800">
            📝 הערה: {order.customer_notes}
          </div>
        )}
      </div>

      {/* Weighing items */}
      <div className="space-y-3">
        <h2 className="font-bold text-dark-800 flex items-center gap-2">
          <Scale size={18} className="text-orange-500" />
          הזן משקלים אמיתיים
        </h2>

        {order.items.map((item, idx) => {
          const w = weights[item.id]
          const isSaved = item.is_weighed
          const actualPrice = item.actual_price
          const isFirst = !loading && idx === order.items.findIndex((i) => !i.is_weighed)

          return (
            <div
              key={item.id}
              className={clsx(
                'card p-4 transition-all duration-300',
                isSaved
                  ? 'bg-green-50 border-green-200'
                  : 'border-orange-200 ring-2 ring-orange-100'
              )}
            >
              <div className="flex items-start gap-3">
                {/* Status icon */}
                <div className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                  isSaved ? 'bg-green-500 text-white' : 'bg-orange-100 text-orange-600'
                )}>
                  {isSaved ? <CheckCircle size={18} /> : <span className="font-bold text-sm">{idx + 1}</span>}
                </div>

                <div className="flex-1 space-y-2">
                  {/* Product name */}
                  <p className="font-bold text-dark-800">{item.product_name_he}</p>

                  {item.pricing_type === 'per_kg' ? (
                    <>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>בקשת לקוח:</span>
                        <span className="font-semibold text-dark-700">{item.requested_weight_kg} ק"ג</span>
                        <span className="text-gray-400">· ₪{item.price_at_order}/ק"ג</span>
                      </div>

                      {/* Weight input */}
                      {!isSaved ? (
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              id={`weight-input-${item.id}`}
                              ref={isFirst ? firstInputRef : undefined}
                              type="number"
                              step="0.001"
                              min="0.001"
                              max="50"
                              className="input-field text-center text-lg font-bold pl-10"
                              placeholder="0.000"
                              value={w?.value || ''}
                              onChange={(e) => handleWeightChange(item.id, e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleWeighItem(item)}
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">ק"ג</span>
                          </div>
                          <button
                            onClick={() => handleWeighItem(item)}
                            disabled={savingItem === item.id}
                            className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-5 py-3 rounded-xl transition-colors disabled:opacity-50"
                          >
                            {savingItem === item.id ? '...' : '✓ שמור'}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-green-100 rounded-xl p-3">
                          <div>
                            <span className="text-sm text-green-700">משקל אמיתי: </span>
                            <span className="font-bold text-green-800 text-lg">{item.actual_weight_kg} ק"ג</span>
                          </div>
                          <div className="text-left">
                            <p className="text-xs text-green-600">מחיר סופי</p>
                            <p className="font-bold text-green-800 text-lg">₪{actualPrice?.toFixed(2)}</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    // Per-unit item — no weight needed
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                      <span className="text-sm text-gray-600">{item.quantity} יחידות × ₪{item.price_at_order}</span>
                      <span className="font-bold text-dark-800">₪{item.estimated_price.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Total & Send payment */}
      <div className="card p-5 sticky bottom-4 shadow-xl">
        {allWeighed ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-dark-800 text-lg">סה"כ סופי:</span>
              <span className="text-2xl font-bold text-brand-600">₪{finalTotal?.toFixed(2)}</span>
            </div>
            {estimatedTotal && finalTotal && (
              <p className="text-xs text-gray-400 mb-3 text-center">
                שערוך מקורי: ₪{estimatedTotal.toFixed(2)} → סופי: ₪{finalTotal.toFixed(2)}
              </p>
            )}
            {order.status === 'weighed' || allWeighed ? (
              <button
                onClick={handleSendPayment}
                disabled={sendingPayment}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 text-base transition-colors disabled:opacity-50"
              >
                <Send size={20} />
                {sendingPayment ? 'שולח...' : 'שלח בקשת תשלום ללקוח'}
              </button>
            ) : null}
          </>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">שערוך כולל</p>
              <p className="text-xl font-bold text-gray-400">₪{estimatedTotal?.toFixed(2)}</p>
            </div>
            <div className="text-left">
              <p className="text-sm text-orange-600 font-semibold">
                עוד {totalItems - weighedCount} פריטים
              </p>
              <p className="text-xs text-gray-400">לשקילה</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
