/**
 * StationWeighPage
 * /station/weigh/:orderId
 * שקילה → בחירת תשלום → הדפסת קבלה
 */
import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  stationGetOrder, stationStartPreparation, stationWeighItem, stationCompleteWeighing,
  type StationOrder, type StationOrderItem,
} from '../../lib/supabase'
import { createPaymentLink, buildPaymentWhatsApp, markOrderPaidManually } from '../../lib/tranzila'
import {
  Scale, CheckCircle, ArrowRight, User, Phone, Truck, Package,
  CreditCard, Banknote, MessageCircle, Printer, X,
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import clsx from 'clsx'

interface WeightInput { value: string; saved: boolean }
type PaymentMethod = 'whatsapp' | 'cash' | 'card'
interface ReceiptData {
  orderNumber: string; customerName: string; customerPhone: string
  items: StationOrderItem[]; total: number
  paymentMethod: PaymentMethod; paymentToken: string | null
}

/* ── Receipt ──────────────────────────────────────────────────────────────── */
function Receipt({ data, onClose }: { data: ReceiptData; onClose: () => void }) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('he-IL')
  const timeStr = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  const methodLabel =
    data.paymentMethod === 'cash' ? 'מזומן' :
    data.paymentMethod === 'card' ? 'כרטיס אשראי (מסוף)' : 'קישור לתשלום (וואטסאפ)'

  return (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          #receipt-printable { display: block !important; }
          @page { size: 80mm auto; margin: 4mm; }
        }
      `}</style>

      {/* Screen modal */}
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden">
          <div className="bg-gray-900 text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Printer size={18} className="text-orange-400" />
              <span className="font-bold">קבלה</span>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg"><X size={18} /></button>
          </div>

          <div className="p-4 font-mono text-sm text-gray-800 bg-white" dir="rtl">
            <div className="text-center border-b pb-3 mb-3">
              <p className="text-base font-bold">באפלו מיטליז</p>
              <p className="text-xs text-gray-500">קצביה מובחרת</p>
              <p className="text-xs text-gray-400 mt-1">{dateStr} {timeStr}</p>
            </div>
            <div className="text-xs mb-3 space-y-0.5">
              <p>הזמנה: <strong>#{data.orderNumber}</strong></p>
              <p>לקוח: {data.customerName}</p>
            </div>
            <div className="border-t border-b py-2 my-2 space-y-1.5">
              {data.items.map((item) => (
                <div key={item.id} className="flex justify-between text-xs gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{item.product_name_he}</p>
                    {item.pricing_type === 'per_kg'
                      ? <p className="text-gray-400">{item.actual_weight_kg ?? item.requested_weight_kg} ק"ג x ₪{item.price_at_order}</p>
                      : <p className="text-gray-400">{item.quantity} יח' x ₪{item.price_at_order}</p>}
                    {item.notes && <p className="text-gray-400">({item.notes})</p>}
                  </div>
                  <p className="shrink-0 font-bold">₪{(item.actual_price ?? item.estimated_price).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold text-base mt-3">
              <span>סה"כ:</span>
              <span>₪{data.total.toFixed(2)}</span>
            </div>
            <p className="mt-2 text-xs text-gray-500">תשלום: {methodLabel}</p>
            {data.paymentMethod === 'whatsapp' && (
              <p className="text-orange-600 text-xs mt-1">קישור תשלום נשלח ללקוח</p>
            )}
            <div className="text-center mt-4 text-xs text-gray-400 border-t pt-3">תודה על הקנייה!</div>
          </div>

          <div className="px-4 pb-4 flex gap-2">
            <button onClick={() => window.print()}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
              <Printer size={16} /> הדפס קבלה
            </button>
            <button onClick={onClose}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-700 transition-colors">
              סגור
            </button>
          </div>
        </div>
      </div>

      {/* Printable — shown only when printing */}
      <div id="receipt-printable" style={{ display: 'none', fontFamily: 'monospace', fontSize: '12px', direction: 'rtl', padding: '4px' }}>
        <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '6px' }}>
          <p style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>באפלו מיטליז</p>
          <p style={{ margin: '2px 0', fontSize: '11px' }}>קצביה מובחרת</p>
          <p style={{ margin: '2px 0', fontSize: '10px' }}>{dateStr}  {timeStr}</p>
        </div>
        <p style={{ margin: '2px 0' }}>הזמנה: #{data.orderNumber}</p>
        <p style={{ margin: '2px 0' }}>לקוח: {data.customerName}</p>
        <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', margin: '6px 0', padding: '4px 0' }}>
          {data.items.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', gap: '4px' }}>
              <div style={{ flex: 1 }}>
                <div>{item.product_name_he}</div>
                {item.pricing_type === 'per_kg'
                  ? <div style={{ fontSize: '10px' }}>{item.actual_weight_kg ?? item.requested_weight_kg} ק"ג x ₪{item.price_at_order}</div>
                  : <div style={{ fontSize: '10px' }}>{item.quantity} יח' x ₪{item.price_at_order}</div>}
                {item.notes && <div style={{ fontSize: '10px' }}>({item.notes})</div>}
              </div>
              <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>₪{(item.actual_price ?? item.estimated_price).toFixed(2)}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', margin: '6px 0' }}>
          <span>סה"כ:</span>
          <span>₪{data.total.toFixed(2)}</span>
        </div>
        <p style={{ fontSize: '10px', margin: '4px 0' }}>תשלום: {methodLabel}</p>
        <div style={{ textAlign: 'center', borderTop: '1px dashed #000', marginTop: '8px', paddingTop: '6px', fontSize: '11px' }}>
          תודה על הקנייה!
        </div>
      </div>
    </>
  )
}

/* ── Payment Modal ────────────────────────────────────────────────────────── */
function PaymentModal({ order, onDone, onCancel }: {
  order: StationOrder
  onDone: (method: PaymentMethod, receipt: ReceiptData) => void
  onCancel: () => void
}) {
  const [loading, setLoading] = useState<PaymentMethod | null>(null)
  const total = order.final_total ?? order.estimated_total

  const handlePay = async (method: PaymentMethod) => {
    setLoading(method)
    try {
      const link = await createPaymentLink(order.id)
      if (!link.success || !link.token) throw new Error(link.error ?? 'שגיאה ביצירת קישור')

      if (method === 'whatsapp') {
        const waUrl = buildPaymentWhatsApp(
          order.customer_phone, order.customer_name, order.order_number,
          total, link.internal_url ?? link.tranzila_url ?? ''
        )
        window.open(waUrl, '_blank')
      } else {
        await markOrderPaidManually(link.token, 'cash')
      }

      onDone(method, {
        orderNumber: order.order_number,
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        items: order.items,
        total,
        paymentMethod: method,
        paymentToken: link.token ?? null,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה בתהליך התשלום')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center" dir="rtl">
      <div className="bg-gray-900 rounded-t-3xl w-full max-w-xl p-6 pb-8 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-gray-400 text-sm">#{order.order_number}</p>
            <h2 className="text-xl font-bold text-white">בחר שיטת תשלום</h2>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">סה"כ לתשלום</p>
            <p className="text-2xl font-bold text-green-400">₪{total.toFixed(2)}</p>
          </div>
        </div>

        <div className="space-y-3">
          <button onClick={() => handlePay('whatsapp')} disabled={!!loading}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-green-700/20 border border-green-700/40 hover:bg-green-700/30 transition-colors disabled:opacity-50">
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shrink-0">
              <MessageCircle size={22} className="text-white" />
            </div>
            <div className="text-right flex-1">
              <p className="font-bold text-white">שלח קישור תשלום בווטסאפ</p>
              <p className="text-xs text-green-400 mt-0.5">הלקוח ישלם אונליין דרך טרנזילה</p>
            </div>
            {loading === 'whatsapp' && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          </button>

          <button onClick={() => handlePay('cash')} disabled={!!loading}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-yellow-700/20 border border-yellow-700/40 hover:bg-yellow-700/30 transition-colors disabled:opacity-50">
            <div className="w-12 h-12 bg-yellow-600 rounded-xl flex items-center justify-center shrink-0">
              <Banknote size={22} className="text-white" />
            </div>
            <div className="text-right flex-1">
              <p className="font-bold text-white">שולם במזומן</p>
              <p className="text-xs text-yellow-400 mt-0.5">תשלום התקבל בחנות</p>
            </div>
            {loading === 'cash' && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          </button>

          <button onClick={() => handlePay('card')} disabled={!!loading}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-blue-700/20 border border-blue-700/40 hover:bg-blue-700/30 transition-colors disabled:opacity-50">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <CreditCard size={22} className="text-white" />
            </div>
            <div className="text-right flex-1">
              <p className="font-bold text-white">שולם בכרטיס (מסוף פיזי)</p>
              <p className="text-xs text-blue-400 mt-0.5">הסליקה בוצעה במסוף הקופה</p>
            </div>
            {loading === 'card' && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          </button>
        </div>

        <button onClick={onCancel} className="w-full mt-4 py-3 text-gray-500 hover:text-gray-300 text-sm transition-colors">
          ביטול
        </button>
      </div>
    </div>
  )
}

/* ── Main Page ────────────────────────────────────────────────────────────── */
export default function StationWeighPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()

  const [order, setOrder] = useState<StationOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [weights, setWeights] = useState<Record<string, WeightInput>>({})
  const [savingItem, setSavingItem] = useState<string | null>(null)
  const [completing, setCompleting] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const firstInputRef = useRef<HTMLInputElement>(null)

  const loadOrder = async () => {
    if (!orderId) return
    setLoading(true)
    try {
      const data = await stationGetOrder(orderId)
      setOrder(data)
      const init: Record<string, WeightInput> = {}
      data.items.forEach((item) => {
        init[item.id] = {
          value: item.actual_weight_kg?.toString() || item.requested_weight_kg?.toString() || '',
          saved: item.is_weighed,
        }
      })
      setWeights(init)
    } catch {
      toast.error('שגיאה בטעינת הזמנה')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrder()
    if (orderId) stationStartPreparation(orderId).catch(() => {})
  }, [orderId])

  useEffect(() => {
    if (!loading) setTimeout(() => firstInputRef.current?.focus(), 200)
  }, [loading])

  const handleWeighItem = async (item: StationOrderItem) => {
    const rawVal = weights[item.id]?.value
    const kg = parseFloat(rawVal)
    if (!rawVal || isNaN(kg) || kg <= 0) { toast.error('הזן משקל תקין'); return }
    setSavingItem(item.id)
    try {
      const updated = await stationWeighItem(orderId!, item.id, kg)
      setOrder(updated)
      setWeights((prev) => ({ ...prev, [item.id]: { value: rawVal, saved: true } }))
      toast.success(item.product_name_he + ' ✓')
      const nextItem = updated.items.find((i) => !i.is_weighed)
      if (nextItem) setTimeout(() => document.getElementById('wi-' + nextItem.id)?.focus(), 80)
    } catch {
      toast.error('שגיאה בשמירת המשקל')
    } finally {
      setSavingItem(null)
    }
  }

  const handleComplete = async () => {
    if (!orderId) return
    setCompleting(true)
    try {
      await stationCompleteWeighing(orderId)
      toast.success('שקילה הושלמה!')
      const updated = await stationGetOrder(orderId)
      setOrder(updated)
      setShowPaymentModal(true)
    } catch {
      toast.error('שגיאה בסיום שקילה')
    } finally {
      setCompleting(false)
    }
  }

  const handlePaymentDone = (_method: PaymentMethod, receipt: ReceiptData) => {
    setShowPaymentModal(false)
    setReceiptData(receipt)
  }

  const handleReceiptClose = () => {
    setReceiptData(null)
    navigate('/station')
  }

  const weighedCount = order?.items.filter((i) => i.is_weighed).length ?? 0
  const totalItems   = order?.items.length ?? 0
  const allWeighed   = totalItems > 0 && weighedCount === totalItems
  const progressPct  = totalItems > 0 ? (weighedCount / totalItems) * 100 : 0

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center" dir="rtl">
      <div className="text-center text-gray-400">
        <Scale size={40} className="animate-pulse mx-auto mb-3 text-orange-500" />
        <p>טוען הזמנה...</p>
      </div>
    </div>
  )

  if (!order) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center" dir="rtl">
      <div className="text-center text-red-400">
        <p className="text-xl font-bold">הזמנה לא נמצאה</p>
        <button onClick={() => navigate('/station')} className="mt-4 text-orange-400 hover:underline">
          חזור לעמדה
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir="rtl">
      <Toaster position="top-center" />

      {showPaymentModal && (
        <PaymentModal order={order} onDone={handlePaymentDone} onCancel={() => setShowPaymentModal(false)} />
      )}
      {receiptData && (
        <Receipt data={receiptData} onClose={handleReceiptClose} />
      )}

      {/* Top bar */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/station')} className="p-2 rounded-xl hover:bg-gray-800 transition-colors">
            <ArrowRight size={20} className="text-gray-400" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">{order.order_number}</span>
              <span className="text-xs bg-orange-600/20 text-orange-400 px-2 py-0.5 rounded-full">שקילה</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-orange-400 leading-tight">
              {weighedCount}<span className="text-gray-600 text-lg">/{totalItems}</span>
            </p>
            <p className="text-xs text-gray-500">נשקלו</p>
          </div>
        </div>
        <div className="max-w-xl mx-auto mt-2">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{
                width: progressPct + '%',
                background: allWeighed ? '#22c55e' : 'linear-gradient(to left, #f97316, #fb923c)',
              }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-4 pb-36 space-y-3">
        {/* Customer */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="flex flex-wrap gap-3 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <User size={14} className="text-gray-500" />{order.customer_name}
            </span>
            <a href={'tel:' + order.customer_phone} className="flex items-center gap-1.5 text-sky-400 hover:underline">
              <Phone size={14} />{order.customer_phone}
            </a>
            <span className="flex items-center gap-1.5">
              <Truck size={14} className="text-gray-500" />
              {order.delivery_type === 'pickup' ? 'איסוף עצמי' : 'משלוח' + (order.delivery_city ? ' — ' + order.delivery_city : '')}
            </span>
          </div>
          {order.customer_notes && (
            <div className="mt-2 bg-yellow-900/20 border border-yellow-800/30 rounded-xl px-3 py-2 text-xs text-yellow-300">
              {order.customer_notes}
            </div>
          )}
        </div>

        <h2 className="font-bold text-gray-300 flex items-center gap-2 px-1">
          <Scale size={16} className="text-orange-400" />
          פריטים לשקילה
        </h2>

        {order.items.map((item, idx) => {
          const w = weights[item.id]
          const isSaved = item.is_weighed
          const isFirst = !loading && idx === order.items.findIndex((i) => !i.is_weighed)
          return (
            <div key={item.id}
              className={clsx(
                'rounded-2xl p-4 border-2 transition-all duration-300',
                isSaved ? 'bg-green-950/30 border-green-900/50' : 'bg-gray-900 border-orange-700/50 ring-1 ring-orange-700/20'
              )}>
              <div className="flex items-start gap-3">
                <div className={clsx(
                  'w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold',
                  isSaved ? 'bg-green-600 text-white' : 'bg-orange-600/20 text-orange-400 text-sm'
                )}>
                  {isSaved ? <CheckCircle size={18} /> : idx + 1}
                </div>
                <div className="flex-1 space-y-2">
                  <p className="font-bold text-white text-base">{item.product_name_he}</p>
                  {item.notes && (
                    <span className="text-xs bg-orange-900/30 text-orange-300 px-2 py-0.5 rounded-full inline-block">
                      {item.notes}
                    </span>
                  )}
                  {item.pricing_type === 'per_kg' ? (
                    <>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>בקשת לקוח:</span>
                        <span className="font-semibold text-white">{item.requested_weight_kg} ק"ג</span>
                        <span>·</span>
                        <span>₪{item.price_at_order}/ק"ג</span>
                      </div>
                      {!isSaved ? (
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              id={'wi-' + item.id}
                              ref={isFirst ? firstInputRef : undefined}
                              type="number" step="0.001" min="0.001" max="50" inputMode="decimal"
                              className="w-full bg-gray-800 border-2 border-gray-700 focus:border-orange-500 rounded-xl px-4 py-3 text-center text-xl font-bold text-white placeholder-gray-600 focus:outline-none pr-12"
                              placeholder="0.000"
                              value={w?.value || ''}
                              onChange={(e) => setWeights((p) => ({ ...p, [item.id]: { ...p[item.id], value: e.target.value, saved: false } }))}
                              onKeyDown={(e) => e.key === 'Enter' && handleWeighItem(item)}
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">ק"ג</span>
                          </div>
                          <button onClick={() => handleWeighItem(item)} disabled={savingItem === item.id}
                            className="bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-50 text-lg">
                            {savingItem === item.id ? '...' : '✓'}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-green-900/30 border border-green-800/40 rounded-xl p-3">
                          <div>
                            <p className="text-xs text-green-500">משקל בפועל</p>
                            <p className="font-bold text-green-300 text-xl">{item.actual_weight_kg} ק"ג</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-green-500">מחיר סופי</p>
                            <p className="font-bold text-green-300 text-xl">₪{item.actual_price?.toFixed(2)}</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-between bg-gray-800/60 rounded-xl p-3">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Package size={14} />
                        {item.quantity} יחידות x ₪{item.price_at_order}
                      </div>
                      <span className="font-bold text-white">₪{item.estimated_price.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </main>

      {/* Sticky bottom */}
      <div className="fixed bottom-0 inset-x-0 bg-gray-950 border-t border-gray-800 p-4">
        <div className="max-w-xl mx-auto">
          {allWeighed ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="font-bold text-gray-300">סה"כ סופי:</span>
                <span className="text-2xl font-bold text-green-400">
                  ₪{(order.final_total ?? order.estimated_total).toFixed(2)}
                </span>
              </div>
              {order.status !== 'weighed' && order.status !== 'payment_pending' && order.status !== 'paid' ? (
                <button onClick={handleComplete} disabled={completing}
                  className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-lg transition-colors disabled:opacity-50">
                  <CheckCircle size={22} />
                  {completing ? 'מסיים...' : 'סיים שקילה — בחר תשלום'}
                </button>
              ) : order.status === 'weighed' ? (
                <button onClick={() => setShowPaymentModal(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-lg transition-colors">
                  <CreditCard size={22} />
                  בחר שיטת תשלום
                </button>
              ) : (
                <div className="bg-green-900/30 border border-green-700/40 rounded-2xl p-4 text-center text-green-400 font-bold">
                  ✓ שקילה ותשלום הושלמו
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between px-1">
              <div>
                <p className="text-xs text-gray-500">שערוך</p>
                <p className="text-xl font-bold text-gray-400">₪{order.estimated_total.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-orange-400 font-bold text-sm">עוד {totalItems - weighedCount} פריטים</p>
                <p className="text-xs text-gray-500">לשקילה</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
