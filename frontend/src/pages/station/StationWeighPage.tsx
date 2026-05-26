/**
 * StationWeighPage — עמדת שקילה
 * עיצוב בהשראת Rexail: גריד מוצרים, פרטי לקוח בראש, מודל שקילה
 */
import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  stationGetOrder, stationStartPreparation, stationWeighItem, stationCompleteWeighing,
  type StationOrder, type StationOrderItem,
} from '../../lib/supabase'
import { createPaymentLink, buildPaymentWhatsApp, markOrderPaidManually } from '../../lib/tranzila'
import {
  CheckCircle, ArrowRight, Phone, MapPin, Clock, Truck, Home,
  CreditCard, Banknote, MessageCircle, Printer, X, Scale, Package,
  AlertCircle,
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

/* ── types ──────────────────────────────────────────────────────────────────── */
type PaymentMethod = 'whatsapp' | 'cash' | 'card'
interface ReceiptData {
  orderNumber: string; customerName: string; customerPhone: string
  items: StationOrderItem[]; total: number
  paymentMethod: PaymentMethod; paymentToken: string | null
}

/* ── Weigh Modal — מודל הזנת משקל ────────────────────────────────────────── */
function WeighModal({
  item, onSave, onCancel, saving,
}: {
  item: StationOrderItem
  onSave: (kg: number) => void
  onCancel: () => void
  saving: boolean
}) {
  const [val, setVal] = useState(
    item.actual_weight_kg?.toString() || item.requested_weight_kg?.toString() || ''
  )
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  const handleSave = () => {
    const kg = parseFloat(val)
    if (!val || isNaN(kg) || kg <= 0) { toast.error('הזן משקל תקין'); return }
    onSave(kg)
  }

  const calcPrice = () => {
    const kg = parseFloat(val)
    if (isNaN(kg) || kg <= 0) return null
    return (kg * item.price_at_order).toFixed(2)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale size={20} />
            <span className="font-bold text-lg">הנח על המשקל</span>
          </div>
          <button onClick={onCancel} className="p-1 hover:bg-white/20 rounded-lg"><X size={20} /></button>
        </div>

        <div className="p-5">
          {/* Product info */}
          <div className="bg-blue-50 rounded-xl p-3 mb-4">
            <p className="font-bold text-gray-900 text-lg">{item.product_name_he}</p>
            {item.notes && (
              <p className="text-red-600 font-semibold text-sm mt-1">⚠ {item.notes}</p>
            )}
            <p className="text-gray-500 text-sm mt-1">
              בקשת לקוח: <strong>{item.requested_weight_kg} ק"ג</strong> · ₪{item.price_at_order}/ק"ג
            </p>
          </div>

          {/* Weight input */}
          <div className="space-y-1 mb-4">
            <label className="text-sm font-semibold text-gray-600">משקל בפועל (ק"ג)</label>
            <div className="relative">
              <input
                ref={inputRef}
                type="number"
                step="0.001"
                min="0.001"
                max="50"
                inputMode="decimal"
                className="w-full border-2 border-blue-400 focus:border-blue-600 rounded-xl px-4 py-4 text-center text-3xl font-bold text-gray-900 placeholder-gray-300 focus:outline-none"
                placeholder="0.000"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">ק"ג</span>
            </div>
          </div>

          {/* Calculated price */}
          {calcPrice() && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 flex justify-between items-center">
              <span className="text-green-700 font-medium">מחיר מחושב:</span>
              <span className="text-green-700 font-bold text-xl">₪{calcPrice()}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-lg"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><CheckCircle size={20} /> אשר משקל</>
              )}
            </button>
            <button
              onClick={onCancel}
              className="px-5 py-3.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-700 transition-colors"
            >
              ביטול
            </button>
          </div>
        </div>
      </div>
    </div>
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
        orderNumber: order.order_number, customerName: order.customer_name,
        customerPhone: order.customer_phone, items: order.items, total,
        paymentMethod: method, paymentToken: link.token ?? null,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center" dir="rtl">
      <div className="bg-white rounded-t-3xl w-full max-w-xl shadow-2xl">
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-bold text-gray-900">בחר שיטת תשלום</h2>
            <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-xl"><X size={20} /></button>
          </div>
          <p className="text-gray-500 text-sm mb-4">#{order.order_number} · {order.customer_name}</p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex justify-between items-center mb-5">
            <span className="font-bold text-gray-700">סה"כ לתשלום</span>
            <span className="text-2xl font-bold text-green-600">₪{total.toFixed(2)}</span>
          </div>
        </div>

        <div className="px-6 pb-8 space-y-3">
          <button onClick={() => handlePay('whatsapp')} disabled={!!loading}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-green-50 border-2 border-green-200 hover:bg-green-100 transition-colors disabled:opacity-50">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shrink-0">
              <MessageCircle size={22} className="text-white" />
            </div>
            <div className="text-right flex-1">
              <p className="font-bold text-gray-900">שלח קישור תשלום בווטסאפ</p>
              <p className="text-xs text-gray-500 mt-0.5">הלקוח ישלם אונליין דרך טרנזילה</p>
            </div>
            {loading === 'whatsapp' && <div className="w-5 h-5 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin shrink-0" />}
          </button>

          <button onClick={() => handlePay('cash')} disabled={!!loading}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-yellow-50 border-2 border-yellow-200 hover:bg-yellow-100 transition-colors disabled:opacity-50">
            <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center shrink-0">
              <Banknote size={22} className="text-white" />
            </div>
            <div className="text-right flex-1">
              <p className="font-bold text-gray-900">שולם במזומן</p>
              <p className="text-xs text-gray-500 mt-0.5">תשלום התקבל בחנות</p>
            </div>
            {loading === 'cash' && <div className="w-5 h-5 border-2 border-gray-300 border-t-yellow-500 rounded-full animate-spin shrink-0" />}
          </button>

          <button onClick={() => handlePay('card')} disabled={!!loading}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-blue-50 border-2 border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shrink-0">
              <CreditCard size={22} className="text-white" />
            </div>
            <div className="text-right flex-1">
              <p className="font-bold text-gray-900">שולם בכרטיס (מסוף פיזי)</p>
              <p className="text-xs text-gray-500 mt-0.5">הסליקה בוצעה במסוף הקופה</p>
            </div>
            {loading === 'card' && <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin shrink-0" />}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Receipt ──────────────────────────────────────────────────────────────── */
function Receipt({ data, onClose }: { data: ReceiptData; onClose: () => void }) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('he-IL')
  const timeStr = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  const methodLabel =
    data.paymentMethod === 'cash' ? 'מזומן' :
    data.paymentMethod === 'card' ? 'כרטיס אשראי' : 'קישור (וואטסאפ)'

  return (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          #receipt-printable { display: block !important; }
          @page { size: 80mm auto; margin: 4mm; }
        }
      `}</style>
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden">
          <div className="bg-gray-900 text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Printer size={18} className="text-orange-400" />
              <span className="font-bold">קבלה</span>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg"><X size={18} /></button>
          </div>
          <div className="p-4 font-mono text-sm text-gray-800" dir="rtl">
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
                    {item.notes && <p className="text-red-500">({item.notes})</p>}
                  </div>
                  <p className="shrink-0 font-bold">₪{(item.actual_price ?? item.estimated_price).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold text-base mt-3">
              <span>סה"כ:</span><span>₪{data.total.toFixed(2)}</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">תשלום: {methodLabel}</p>
            <div className="text-center mt-4 text-xs text-gray-400 border-t pt-3">תודה על הקנייה!</div>
          </div>
          <div className="px-4 pb-4 flex gap-2">
            <button onClick={() => window.print()}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
              <Printer size={16} /> הדפס קבלה
            </button>
            <button onClick={onClose}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-700 transition-colors">
              סגור
            </button>
          </div>
        </div>
      </div>
      {/* Print-only */}
      <div id="receipt-printable" style={{ display:'none', fontFamily:'monospace', fontSize:'12px', direction:'rtl', padding:'4px' }}>
        <div style={{ textAlign:'center', borderBottom:'1px dashed #000', paddingBottom:'6px', marginBottom:'6px' }}>
          <p style={{ fontSize:'16px', fontWeight:'bold', margin:0 }}>באפלו מיטליז</p>
          <p style={{ margin:'2px 0', fontSize:'11px' }}>קצביה מובחרת</p>
          <p style={{ margin:'2px 0', fontSize:'10px' }}>{dateStr}  {timeStr}</p>
        </div>
        <p style={{ margin:'2px 0' }}>הזמנה: #{data.orderNumber}</p>
        <p style={{ margin:'2px 0' }}>לקוח: {data.customerName}</p>
        <div style={{ borderTop:'1px dashed #000', borderBottom:'1px dashed #000', margin:'6px 0', padding:'4px 0' }}>
          {data.items.map((item) => (
            <div key={item.id} style={{ display:'flex', justifyContent:'space-between', marginBottom:'3px', gap:'4px' }}>
              <div style={{ flex:1 }}>
                <div>{item.product_name_he}</div>
                {item.pricing_type === 'per_kg'
                  ? <div style={{ fontSize:'10px' }}>{item.actual_weight_kg ?? item.requested_weight_kg} ק"ג x ₪{item.price_at_order}</div>
                  : <div style={{ fontSize:'10px' }}>{item.quantity} יח' x ₪{item.price_at_order}</div>}
                {item.notes && <div style={{ fontSize:'10px' }}>({item.notes})</div>}
              </div>
              <div style={{ fontWeight:'bold', whiteSpace:'nowrap' }}>₪{(item.actual_price ?? item.estimated_price).toFixed(2)}</div>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontWeight:'bold', fontSize:'14px', margin:'6px 0' }}>
          <span>סה"כ:</span><span>₪{data.total.toFixed(2)}</span>
        </div>
        <p style={{ fontSize:'10px', margin:'4px 0' }}>תשלום: {methodLabel}</p>
        <div style={{ textAlign:'center', borderTop:'1px dashed #000', marginTop:'8px', paddingTop:'6px', fontSize:'11px' }}>תודה על הקנייה!</div>
      </div>
    </>
  )
}

/* ── Product Card ─────────────────────────────────────────────────────────── */
function ProductCard({
  item, index, onClick,
}: {
  item: StationOrderItem
  index: number
  onClick: () => void
}) {
  const weighed = item.is_weighed

  return (
    <button
      onClick={weighed ? undefined : onClick}
      disabled={weighed}
      className={[
        'relative rounded-2xl border-2 overflow-hidden transition-all duration-200 text-right w-full',
        weighed
          ? 'bg-green-50 border-green-300 cursor-default'
          : 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-md active:scale-[0.98] cursor-pointer shadow-sm',
      ].join(' ')}
    >
      {/* Image area */}
      <div className="relative bg-gray-100 h-28 flex items-center justify-center overflow-hidden">
        {item.pricing_type === 'per_kg' ? null : null}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {(item as any).image_url ? (
          <img
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            src={(item as any).image_url}
            alt={item.product_name_he}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-5xl opacity-30">🥩</div>
        )}

        {/* Weighed overlay */}
        {weighed && (
          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
            <div className="bg-green-500 rounded-full p-2">
              <CheckCircle size={28} className="text-white" />
            </div>
          </div>
        )}

        {/* Item number badge */}
        {!weighed && (
          <div className="absolute top-2 right-2 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
            {index + 1}
          </div>
        )}

        {/* Fresh badge */}
        <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          טרי
        </div>
      </div>

      {/* Info area */}
      <div className="p-3">
        <p className="font-bold text-gray-900 text-sm leading-tight">{item.product_name_he}</p>

        {/* Notes in red — like Rexail */}
        {item.notes && (
          <p className="text-red-500 text-xs font-semibold mt-1">{item.notes}</p>
        )}

        <div className="mt-2">
          {weighed ? (
            <div className="space-y-0.5">
              <p className="text-green-600 font-bold text-sm">{item.actual_weight_kg} ק"ג</p>
              <p className="text-gray-500 text-xs">₪{item.price_at_order}/ק"ג</p>
              <p className="text-green-700 font-bold text-base">₪{item.actual_price?.toFixed(2)}</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              <p className="text-gray-700 font-semibold text-sm">{item.requested_weight_kg} ק"ג</p>
              <p className="text-gray-400 text-xs">₪{item.price_at_order}/ק"ג</p>
              <p className="text-blue-600 font-bold text-sm">~₪{item.estimated_price.toFixed(2)}</p>
            </div>
          )}
        </div>

        {/* Per-unit indicator */}
        {item.pricing_type === 'per_unit' && (
          <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
            <Package size={11} />
            <span>{item.quantity} יחידות</span>
          </div>
        )}
      </div>
    </button>
  )
}

/* ── Main Page ────────────────────────────────────────────────────────────── */
export default function StationWeighPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()

  const [order, setOrder] = useState<StationOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeItem, setActiveItem] = useState<StationOrderItem | null>(null)
  const [savingItem, setSavingItem] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)

  const loadOrder = async () => {
    if (!orderId) return
    setLoading(true)
    try {
      const data = await stationGetOrder(orderId)
      setOrder(data)
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

  // Auto-open first unweighed item
  useEffect(() => {
    if (order && !loading && !activeItem) {
      const first = order.items.find((i) => !i.is_weighed)
      if (first) setActiveItem(first)
    }
  }, [order, loading])

  const handleWeighItem = async (kg: number) => {
    if (!activeItem || !orderId) return
    setSavingItem(true)
    try {
      const updated = await stationWeighItem(orderId, activeItem.id, kg)
      setOrder(updated)
      toast.success(activeItem.product_name_he + ' ✓')
      // Auto-advance to next unweighed
      const next = updated.items.find((i) => !i.is_weighed)
      setActiveItem(next ?? null)
    } catch {
      toast.error('שגיאה בשמירת המשקל')
    } finally {
      setSavingItem(false)
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

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
      <div className="text-center text-gray-400">
        <Scale size={40} className="animate-pulse mx-auto mb-3 text-blue-500" />
        <p className="text-gray-500">טוען הזמנה...</p>
      </div>
    </div>
  )
  if (!order) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
      <div className="text-center">
        <p className="text-xl font-bold text-gray-700">הזמנה לא נמצאה</p>
        <button onClick={() => navigate('/station')} className="mt-4 text-blue-600 hover:underline">
          חזור לעמדה
        </button>
      </div>
    </div>
  )

  const weighedCount = order.items.filter((i) => i.is_weighed).length
  const totalItems   = order.items.length
  const allWeighed   = totalItems > 0 && weighedCount === totalItems
  const runningTotal = order.items.reduce((sum, i) =>
    sum + (i.is_weighed ? (i.actual_price ?? 0) : i.estimated_price), 0
  )

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <Toaster position="top-center" />

      {/* Modals */}
      {activeItem && !activeItem.is_weighed && (
        <WeighModal
          item={activeItem}
          onSave={handleWeighItem}
          onCancel={() => setActiveItem(null)}
          saving={savingItem}
        />
      )}
      {showPaymentModal && (
        <PaymentModal order={order} onDone={handlePaymentDone} onCancel={() => setShowPaymentModal(false)} />
      )}
      {receiptData && (
        <Receipt data={receiptData} onClose={() => { setReceiptData(null); navigate('/station') }} />
      )}

      {/* ── Top header bar ── */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4">
          {/* Row 1 — order # + back + progress */}
          <div className="flex items-center gap-3 py-3">
            <button
              onClick={() => navigate('/station')}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors shrink-0"
            >
              <ArrowRight size={20} className="text-gray-500" />
            </button>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-lg">הזמנה #{order.order_number}</span>
                <span className={[
                  'text-xs px-2 py-0.5 rounded-full font-semibold',
                  allWeighed ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                ].join(' ')}>
                  {allWeighed ? 'שקול' : 'בהכנה'}
                </span>
              </div>
              {/* Progress bar */}
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: totalItems > 0 ? (weighedCount / totalItems * 100) + '%' : '0%',
                      background: allWeighed ? '#22c55e' : '#3b82f6',
                    }}
                  />
                </div>
                <span className="text-xs text-gray-500 shrink-0 font-medium">
                  {weighedCount}/{totalItems} פריטים
                </span>
              </div>
            </div>

            {/* Running total */}
            <div className="text-right shrink-0">
              <p className="text-xs text-gray-400">סה"כ</p>
              <p className="font-bold text-gray-900 text-lg">₪{runningTotal.toFixed(2)}</p>
            </div>
          </div>

          {/* Row 2 — customer info */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 pb-3 text-sm">
            <div className="flex items-center gap-1.5 text-gray-700 font-semibold">
              <span>{order.customer_name}</span>
            </div>
            <a href={'tel:' + order.customer_phone}
              className="flex items-center gap-1 text-blue-600 hover:underline">
              <Phone size={13} />
              <span>{order.customer_phone}</span>
            </a>
            {order.delivery_type === 'delivery' ? (
              <div className="flex items-center gap-1 text-gray-500">
                <MapPin size={13} />
                <span>{order.delivery_address}{order.delivery_city ? ', ' + order.delivery_city : ''}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-500">
                <Home size={13} />
                <span>איסוף עצמי</span>
              </div>
            )}
            {order.preferred_delivery_time && (
              <div className="flex items-center gap-1 text-gray-500">
                <Clock size={13} />
                <span>{order.preferred_delivery_time}</span>
              </div>
            )}
            {order.delivery_type === 'delivery' && (
              <div className="flex items-center gap-1 text-gray-500">
                <Truck size={13} />
                <span>משלוח</span>
              </div>
            )}
          </div>

          {/* Customer notes */}
          {order.customer_notes && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3 text-sm">
              <AlertCircle size={15} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-amber-800 font-medium">{order.customer_notes}</p>
            </div>
          )}
        </div>
      </header>

      {/* ── Product Grid ── */}
      <main className="max-w-3xl mx-auto px-4 py-4 pb-32">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {order.items.map((item, idx) => (
            <ProductCard
              key={item.id}
              item={item}
              index={idx}
              onClick={() => setActiveItem(item)}
            />
          ))}
        </div>
      </main>

      {/* ── Bottom action bar ── */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 shadow-lg z-10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          {allWeighed ? (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-gray-500">סה"כ סופי</p>
                <p className="text-2xl font-bold text-green-600">
                  ₪{(order.final_total ?? runningTotal).toFixed(2)}
                </p>
              </div>
              {order.status !== 'payment_pending' && order.status !== 'paid' && order.status !== 'weighed' ? (
                <button
                  onClick={handleComplete}
                  disabled={completing}
                  className="flex-1 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-lg transition-colors disabled:opacity-50"
                >
                  <CheckCircle size={22} />
                  {completing ? 'מסיים...' : 'סיום'}
                </button>
              ) : order.status === 'weighed' ? (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-lg transition-colors"
                >
                  <CreditCard size={22} /> תשלום
                </button>
              ) : (
                <div className="flex-1 bg-green-100 border border-green-300 rounded-2xl p-4 text-center text-green-700 font-bold">
                  ✓ הושלם
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-gray-400">שערוך נוכחי</p>
                <p className="text-xl font-bold text-gray-700">₪{runningTotal.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-blue-600 font-bold">
                  {totalItems - weighedCount} פריטים לשקילה
                </p>
                <p className="text-xs text-gray-400">לחץ על מוצר לשקילה</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
