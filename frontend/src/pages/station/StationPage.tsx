/**
 * StationPage — עמדת השקילה הנפרדת
 * נגיש בכתובת /station — ללא צורך בהתחברות לאדמין
 * כולל: תור שקילה + הזמנות מוכנות עם שיוך שליח ו-WhatsApp
 */
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  stationGetQueue,
  stationGetReadyOrders,
  stationAssignCourier,
  type StationOrder,
} from '../../lib/supabase'
import {
  Scale, CheckCircle, RefreshCw, Clock,
  User, MapPin, Phone, Truck, MessageCircle, Package,
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import clsx from 'clsx'

type Tab = 'queue' | 'ready'
type CourierInputMap = Record<string, { name: string; phone: string }>

export default function StationPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('queue')
  const [queue, setQueue] = useState<StationOrder[]>([])
  const [ready, setReady] = useState<StationOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(new Date())
  const [courierInputs, setCourierInputs] = useState<CourierInputMap>({})
  const [savingCourier, setSavingCourier] = useState<string | null>(null)

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [q, r] = await Promise.all([stationGetQueue(), stationGetReadyOrders()])
      setQueue(q)
      setReady(r)
      // Sync courier inputs with saved data
      setCourierInputs((prev) => {
        const next = { ...prev }
        r.forEach((o) => {
          if (!next[o.id]) {
            next[o.id] = {
              name: o.courier_name || '',
              phone: o.courier_phone || '',
            }
          }
        })
        return next
      })
    } catch {
      toast.error('שגיאה בטעינת הזמנות')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const t = setInterval(fetchAll, 30000)
    return () => clearInterval(t)
  }, [fetchAll])

  const handleSaveCourier = async (orderId: string) => {
    const input = courierInputs[orderId]
    if (!input?.name?.trim() || !input?.phone?.trim()) {
      toast.error('הזן שם וטלפון שליח')
      return
    }
    setSavingCourier(orderId)
    try {
      await stationAssignCourier(orderId, input.name.trim(), input.phone.trim())
      setReady((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, courier_name: input.name, courier_phone: input.phone }
            : o
        )
      )
      toast.success('שליח שויך ✓')
    } catch {
      toast.error('שגיאה בשמירת שליח')
    } finally {
      setSavingCourier(null)
    }
  }

  const buildWhatsAppMessage = (courierPhone: string): string => {
    const courierOrders = ready.filter((o) => o.courier_phone === courierPhone && o.delivery_type === 'delivery')
    const courierName = courierOrders[0]?.courier_name || 'שליח'
    const lines: string[] = [
      `היי ${courierName} 👋`,
      `יש לך ${courierOrders.length} הזמנות להעביר היום:`,
      '',
    ]
    courierOrders.forEach((o, i) => {
      lines.push(`${i + 1}. ${o.customer_name}`)
      if (o.delivery_address) {
        lines.push(`   📍 ${o.delivery_address}${o.delivery_city ? ', ' + o.delivery_city : ''}`)
      }
      if (o.preferred_delivery_time) {
        lines.push(`   ⏰ ${o.preferred_delivery_time}`)
      }
      lines.push(`   📦 ${o.order_number} — ₪${o.final_total?.toFixed(2) ?? '?'}`)
      lines.push(`   📞 ${o.customer_phone}`)
      lines.push('')
    })
    lines.push(`סה"כ ${courierOrders.length} חבילות`)
    lines.push('בהצלחה! 🚚')
    return lines.join('\n')
  }

  const handleSendWhatsApp = (courierPhone: string) => {
    const msg = buildWhatsAppMessage(courierPhone)
    const waPhone = courierPhone.startsWith('0')
      ? '972' + courierPhone.slice(1).replace(/-/g, '')
      : courierPhone.replace(/-/g, '')
    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const timeStr = now.toLocaleTimeString('he-IL', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  const dateStr = now.toLocaleDateString('he-IL', {
    weekday: 'short', day: 'numeric', month: 'numeric',
  })

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir="rtl">
      <Toaster position="top-center" />

      {/* ── Top bar ── */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shrink-0">
            <Scale size={22} />
          </div>
          <div>
            <p className="font-bold text-base leading-tight">עמדת שקילה</p>
            <p className="text-xs text-gray-400">באפלו מיטליז</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-center hidden sm:block">
            <p className="text-lg font-mono font-bold text-orange-400 leading-tight">{timeStr}</p>
            <p className="text-xs text-gray-500">{dateStr}</p>
          </div>
          <button
            onClick={fetchAll}
            className="p-2 rounded-xl hover:bg-gray-800 transition-colors"
            title="רענן"
          >
            <RefreshCw size={18} className={clsx('text-gray-400', loading && 'animate-spin')} />
          </button>
        </div>
      </header>

      {/* ── Tabs ── */}
      <div className="bg-gray-900 border-b border-gray-800 flex">
        <button
          onClick={() => setTab('queue')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 px-4 py-4 font-bold text-sm border-b-2 transition-colors',
            tab === 'queue'
              ? 'border-orange-500 text-orange-400 bg-orange-500/5'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          )}
        >
          <Scale size={18} />
          תור שקילה
          {queue.length > 0 && (
            <span className="bg-orange-600 text-white text-xs px-2 py-0.5 rounded-full font-bold min-w-[22px] text-center">
              {queue.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('ready')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 px-4 py-4 font-bold text-sm border-b-2 transition-colors',
            tab === 'ready'
              ? 'border-green-500 text-green-400 bg-green-500/5'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          )}
        >
          <CheckCircle size={18} />
          מוכן למשלוח
          {ready.length > 0 && (
            <span className="bg-green-700 text-white text-xs px-2 py-0.5 rounded-full font-bold min-w-[22px] text-center">
              {ready.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Content ── */}
      <main className="p-4 max-w-2xl mx-auto pb-10">
        {loading && queue.length === 0 && ready.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <RefreshCw size={32} className="animate-spin mx-auto mb-3 text-gray-600" />
            טוען הזמנות...
          </div>
        ) : tab === 'queue' ? (
          <QueueTab
            orders={queue}
            onSelect={(id) => navigate(`/station/weigh/${id}`)}
          />
        ) : (
          <ReadyTab
            orders={ready}
            courierInputs={courierInputs}
            setCourierInputs={setCourierInputs}
            savingCourier={savingCourier}
            onSaveCourier={handleSaveCourier}
            onSendWhatsApp={handleSendWhatsApp}
          />
        )}
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// Queue Tab
// ─────────────────────────────────────────────────────
function QueueTab({
  orders,
  onSelect,
}: {
  orders: StationOrder[]
  onSelect: (id: string) => void
}) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-24">
        <Scale size={64} className="text-gray-800 mx-auto mb-4" />
        <p className="text-xl font-bold text-gray-500">אין הזמנות לשקילה</p>
        <p className="text-sm text-gray-600 mt-2">כל ההזמנות טופלו ✓</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-orange-400 font-semibold px-1">
        {orders.length} הזמנות ממתינות לשקילה
      </p>
      {orders.map((order, idx) => {
        const weighedCount = order.items.filter((i) => i.is_weighed).length
        const totalItems = order.items.length
        const progress = totalItems > 0 ? (weighedCount / totalItems) * 100 : 0
        const inProgress = order.status === 'in_preparation' && weighedCount > 0

        return (
          <button
            key={order.id}
            onClick={() => onSelect(order.id)}
            className="w-full bg-gray-900 border-2 border-gray-800 hover:border-orange-500 rounded-2xl p-5 text-right transition-all hover:bg-gray-800/40 active:scale-[0.99]"
          >
            <div className="flex items-start gap-4">
              {/* Priority badge */}
              <div className="w-12 h-12 bg-orange-600/15 text-orange-400 rounded-xl flex items-center justify-center font-bold text-xl shrink-0">
                {idx + 1}
              </div>

              <div className="flex-1 min-w-0">
                {/* Order number + status */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-lg text-white">{order.order_number}</span>
                  <span className={clsx(
                    'text-xs px-2 py-0.5 rounded-full font-semibold',
                    order.status === 'new'
                      ? 'bg-blue-900/50 text-blue-400'
                      : 'bg-yellow-900/40 text-yellow-400'
                  )}>
                    {order.status === 'new' ? 'חדש' : 'בהכנה'}
                  </span>
                  {inProgress && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-900/40 text-orange-300 font-semibold">
                      {weighedCount}/{totalItems} נשקלו
                    </span>
                  )}
                </div>

                {/* Customer info */}
                <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-400 flex-wrap">
                  <span className="flex items-center gap-1"><User size={13} />{order.customer_name}</span>
                  <span className="flex items-center gap-1">
                    <Truck size={13} />
                    {order.delivery_type === 'pickup' ? 'איסוף' : 'משלוח'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={13} />
                    {new Date(order.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Items preview */}
                <div className="mt-2 space-y-0.5">
                  {order.items.slice(0, 4).map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <span className={clsx(
                        'w-3 h-3 rounded-full shrink-0',
                        item.is_weighed ? 'bg-green-500' : 'bg-gray-700'
                      )} />
                      <span className="text-gray-300 truncate">{item.product_name_he}</span>
                      {item.pricing_type === 'per_kg' && item.requested_weight_kg && (
                        <span className="text-gray-500 text-xs shrink-0">{item.requested_weight_kg} ק"ג</span>
                      )}
                      {item.notes && (
                        <span className="text-orange-400 text-xs shrink-0">✂ {item.notes}</span>
                      )}
                    </div>
                  ))}
                  {order.items.length > 4 && (
                    <p className="text-xs text-gray-600">+ עוד {order.items.length - 4} פריטים</p>
                  )}
                </div>

                {/* Notes */}
                {order.customer_notes && (
                  <div className="mt-2 text-xs text-yellow-400 bg-yellow-900/20 rounded-lg px-2 py-1">
                    📝 {order.customer_notes}
                  </div>
                )}

                {/* Progress bar */}
                {weighedCount > 0 && (
                  <div className="mt-3 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-green-500 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="text-orange-500 font-bold text-2xl shrink-0 mt-1">←</div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between text-sm">
              <span className="text-gray-500">{totalItems} פריטים</span>
              <span className="font-bold text-orange-300">~₪{order.estimated_total.toFixed(2)}</span>
              <span className="bg-orange-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold">
                {inProgress ? 'המשך שקילה ←' : 'התחל שקילה ←'}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────
// Ready Tab
// ─────────────────────────────────────────────────────
function ReadyTab({
  orders,
  courierInputs,
  setCourierInputs,
  savingCourier,
  onSaveCourier,
  onSendWhatsApp,
}: {
  orders: StationOrder[]
  courierInputs: CourierInputMap
  setCourierInputs: React.Dispatch<React.SetStateAction<CourierInputMap>>
  savingCourier: string | null
  onSaveCourier: (id: string) => void
  onSendWhatsApp: (phone: string) => void
}) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-24">
        <CheckCircle size={64} className="text-gray-800 mx-auto mb-4" />
        <p className="text-xl font-bold text-gray-500">אין הזמנות מוכנות</p>
        <p className="text-sm text-gray-600 mt-2">לאחר השקילה ההזמנות יופיעו כאן</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-green-400 font-semibold px-1">
        {orders.length} הזמנות מוכנות
      </p>

      {orders.map((order) => {
        const input = courierInputs[order.id] || { name: '', phone: '' }
        const isDelivery = order.delivery_type === 'delivery'
        const hasCourier = !!order.courier_phone

        const statusLabel: Record<string, string> = {
          weighed: 'נשקל',
          payment_pending: 'ממתין לתשלום',
          paid: 'שולם ✓',
        }

        return (
          <div key={order.id} className="bg-gray-900 border-2 border-gray-800 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-lg text-white">{order.order_number}</span>
                    <span className={clsx(
                      'text-xs px-2 py-0.5 rounded-full font-semibold',
                      order.status === 'paid'
                        ? 'bg-green-900/60 text-green-300'
                        : 'bg-gray-800 text-gray-400'
                    )}>
                      {statusLabel[order.status] ?? order.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1.5 text-sm text-gray-400">
                    <span className="flex items-center gap-1"><User size={13} />{order.customer_name}</span>
                    <a
                      href={`tel:${order.customer_phone}`}
                      className="flex items-center gap-1 text-sky-400 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone size={13} />{order.customer_phone}
                    </a>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500">סה"כ סופי</p>
                  <p className="text-2xl font-bold text-green-400">
                    ₪{(order.final_total ?? order.estimated_total).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Delivery address */}
              {isDelivery && order.delivery_address && (
                <div className="mt-3 bg-gray-800/60 rounded-xl p-3 flex items-start gap-2">
                  <MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-white font-medium">{order.delivery_address}</p>
                    {order.delivery_city && (
                      <p className="text-xs text-gray-400">{order.delivery_city}</p>
                    )}
                    {order.preferred_delivery_time && (
                      <p className="text-xs text-orange-400 mt-0.5">⏰ {order.preferred_delivery_time}</p>
                    )}
                  </div>
                </div>
              )}

              {!isDelivery && (
                <div className="mt-3 bg-blue-900/15 border border-blue-800/30 rounded-xl p-3 flex items-center gap-2 text-sm text-blue-400">
                  <Package size={15} />
                  איסוף עצמי — לא נדרש שליח
                </div>
              )}

              {/* Notes */}
              {order.customer_notes && (
                <div className="mt-2 text-xs text-yellow-400 bg-yellow-900/20 rounded-lg px-2 py-1">
                  📝 {order.customer_notes}
                </div>
              )}
            </div>

            {/* Courier section — only for deliveries */}
            {isDelivery && (
              <div className="border-t border-gray-800 px-5 py-4 bg-gray-950/40">
                {hasCourier ? (
                  /* Courier already assigned */
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">שליח משויך</p>
                      <p className="font-bold text-white">{order.courier_name}</p>
                      <p className="text-sm text-gray-400">{order.courier_phone}</p>
                    </div>
                    <button
                      onClick={() => onSendWhatsApp(order.courier_phone!)}
                      className="flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white font-bold px-4 py-2.5 rounded-xl transition-colors text-sm shrink-0"
                    >
                      <MessageCircle size={16} />
                      שלח WhatsApp לשליח
                    </button>
                  </div>
                ) : (
                  /* Assign courier */
                  <div>
                    <p className="text-xs text-gray-500 mb-2">שייך שליח להזמנה זו</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="שם שליח"
                        value={input.name}
                        onChange={(e) =>
                          setCourierInputs((p) => ({
                            ...p,
                            [order.id]: { ...p[order.id], name: e.target.value },
                          }))
                        }
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:border-orange-500 focus:outline-none"
                      />
                      <input
                        type="tel"
                        placeholder="05X-XXXXXXX"
                        value={input.phone}
                        dir="ltr"
                        onChange={(e) =>
                          setCourierInputs((p) => ({
                            ...p,
                            [order.id]: { ...p[order.id], phone: e.target.value },
                          }))
                        }
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:border-orange-500 focus:outline-none"
                      />
                      <button
                        onClick={() => onSaveCourier(order.id)}
                        disabled={savingCourier === order.id}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50 shrink-0"
                      >
                        {savingCourier === order.id ? '...' : 'שמור'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
