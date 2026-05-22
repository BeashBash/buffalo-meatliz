import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowLeft, ShoppingBag } from 'lucide-react'
import { useCartStore } from '../../store/cart'
import { storeApi } from '../../lib/api'
import toast from 'react-hot-toast'
import type { CheckoutForm } from '../../types'

const DELIVERY_TIMES = [
  'בהקדם האפשרי',
  'בוקר (09:00-12:00)',
  'צהריים (12:00-15:00)',
  'אחר הצהריים (15:00-18:00)',
  'ערב (18:00-21:00)',
]

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, estimatedTotal, clearCart } = useCartStore()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState<CheckoutForm>({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    delivery_type: 'delivery',
    delivery_address: '',
    delivery_city: 'באר שבע',
    preferred_delivery_time: DELIVERY_TIMES[0],
    customer_notes: '',
    coupon_code: '',
  })

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-brand-50 p-4">
        <ShoppingBag size={64} className="text-gray-300" />
        <h2 className="text-xl font-bold text-gray-500">הסל ריק</h2>
        <button onClick={() => navigate('/')} className="btn-primary">חזרה לחנות</button>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.customer_name || !form.customer_phone) {
      toast.error('נא למלא שם ומספר טלפון')
      return
    }

    setLoading(true)
    try {
      const orderItems = items.map((item) => ({
        product_id: item.product.id,
        product_name_he: item.product.name_he,
        pricing_type: item.product.pricing_type,
        price_at_order: item.product.price,
        requested_weight_kg: item.requested_weight_kg,
        quantity: item.quantity,
        estimated_price: item.estimated_price,
      }))

      const { data } = await storeApi.checkout({
        ...form,
        customer_email: form.customer_email || undefined,
        coupon_code: form.coupon_code || undefined,
        items: orderItems,
      })

      clearCart()
      navigate(`/order-success/${data.order_number}`)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'שגיאה בשליחת ההזמנה. נסו שנית.')
    } finally {
      setLoading(false)
    }
  }

  const update = (field: keyof CheckoutForm, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const total = estimatedTotal()

  return (
    <div className="min-h-screen bg-brand-50">
      {/* Header */}
      <div className="bg-dark-800 text-white py-4 px-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1 hover:bg-white/10 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-lg">השלמת הזמנה</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Weighing notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-amber-800 text-sm">חשוב לדעת</p>
            <p className="text-amber-700 text-sm mt-0.5">
              לא תחויבו בשלב זה. המחיר הסופי יחושב לאחר שקילת המוצרים ותקבלו הודעה עם פרטי התשלום.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Personal details */}
          <div className="card p-5 space-y-4">
            <h2 className="font-bold text-dark-800 text-base">פרטים אישיים</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">שם מלא *</label>
              <input
                type="text"
                className="input-field"
                placeholder="ישראל ישראלי"
                value={form.customer_name}
                onChange={(e) => update('customer_name', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">טלפון *</label>
              <input
                type="tel"
                className="input-field"
                placeholder="050-0000000"
                value={form.customer_phone}
                onChange={(e) => update('customer_phone', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">אימייל (אופציונלי)</label>
              <input
                type="email"
                className="input-field"
                placeholder="email@example.com"
                value={form.customer_email}
                onChange={(e) => update('customer_email', e.target.value)}
              />
            </div>
          </div>

          {/* Delivery */}
          <div className="card p-5 space-y-4">
            <h2 className="font-bold text-dark-800 text-base">אופן קבלה</h2>
            <div className="grid grid-cols-2 gap-3">
              {(['delivery', 'pickup'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => update('delivery_type', type)}
                  className={`py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                    form.delivery_type === type
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {type === 'delivery' ? '🚚 משלוח' : '🏪 איסוף עצמי'}
                </button>
              ))}
            </div>

            {form.delivery_type === 'delivery' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">כתובת</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="רחוב ומספר"
                    value={form.delivery_address}
                    onChange={(e) => update('delivery_address', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">עיר</label>
                  <input
                    type="text"
                    className="input-field"
                    value={form.delivery_city}
                    onChange={(e) => update('delivery_city', e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">זמן מועדף</label>
              <select
                className="input-field"
                value={form.preferred_delivery_time}
                onChange={(e) => update('preferred_delivery_time', e.target.value)}
              >
                {DELIVERY_TIMES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="card p-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">הערות</label>
            <textarea
              className="input-field resize-none"
              rows={3}
              placeholder="הערות מיוחדות, אלרגיות, בקשות..."
              value={form.customer_notes}
              onChange={(e) => update('customer_notes', e.target.value)}
            />
          </div>

          {/* Order summary */}
          <div className="card p-5">
            <h2 className="font-bold text-dark-800 text-base mb-3">סיכום הזמנה</h2>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.product.name_he}</span>
                  <span className="font-medium">~₪{item.estimated_price.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t mt-3 pt-3 flex justify-between font-bold">
              <span>שערוך כולל:</span>
              <span className="text-brand-600 text-lg">₪{total.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">* המחיר הסופי לאחר שקילה</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-center text-base py-4"
          >
            {loading ? 'שולח...' : 'שליחת הזמנה 🥩'}
          </button>
        </form>
      </div>
    </div>
  )
}
