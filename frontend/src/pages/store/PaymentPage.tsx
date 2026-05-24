import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { getOrderByToken } from '../../lib/tranzila'
import { CheckCircle, XCircle, Clock, CreditCard, ShieldCheck } from 'lucide-react'

const TERMINAL = import.meta.env.VITE_TRANZILA_TERMINAL as string | undefined

export default function PaymentPage() {
  const { token } = useParams<{ token: string }>()
  const [params] = useSearchParams()
  const status = params.get('status') // 'success' | 'fail' | null
  const txid   = params.get('TranzilaTK') ?? params.get('txid')

  const [order, setOrder] = useState<Awaited<ReturnType<typeof getOrderByToken>>>(null)
  const [loading, setLoading] = useState(true)
  const [iframeReady, setIframeReady] = useState(false)

  useEffect(() => {
    if (!token) return
    getOrderByToken(token).then(setOrder).finally(() => setLoading(false))
  }, [token])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center text-gray-400">
        <Clock size={40} className="mx-auto mb-3 animate-pulse"/>
        <p>טוען פרטי תשלום...</p>
      </div>
    </div>
  )

  if (!order) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <div className="text-center text-gray-500 bg-white rounded-2xl p-10 shadow-lg">
        <XCircle size={48} className="mx-auto mb-4 text-red-400"/>
        <h2 className="text-xl font-bold">קישור לא תקף</h2>
        <p className="text-sm text-gray-400 mt-2">הקישור לא נמצא או פג תוקפו</p>
      </div>
    </div>
  )

  // Already paid
  if (order.status === 'paid' || order.status === 'delivered') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <div className="text-center bg-white rounded-2xl p-10 shadow-lg max-w-sm">
        <CheckCircle size={56} className="mx-auto mb-4 text-green-500"/>
        <h2 className="text-2xl font-bold text-gray-800">ההזמנה שולמה!</h2>
        <p className="text-gray-500 mt-2">תודה {order.customer_name}, הכל בסדר 🥩</p>
        <div className="mt-4 bg-green-50 rounded-xl p-4">
          <p className="text-sm text-gray-600">הזמנה <span className="font-mono font-bold">#{order.order_number}</span></p>
          <p className="text-2xl font-bold text-green-600 mt-1">₪{order.amount_due?.toFixed(2)}</p>
        </div>
      </div>
    </div>
  )

  // Came back from Tranzila with status
  if (status === 'success') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <div className="text-center bg-white rounded-2xl p-10 shadow-lg max-w-sm">
        <CheckCircle size={56} className="mx-auto mb-4 text-green-500"/>
        <h2 className="text-2xl font-bold text-gray-800">התשלום הצליח!</h2>
        <p className="text-gray-500 mt-2">תודה {order.customer_name}!</p>
        {txid && <p className="text-xs text-gray-400 mt-1">אסמכתא: {txid}</p>}
        <div className="mt-4 bg-green-50 rounded-xl p-4">
          <p className="text-sm text-gray-600">הזמנה <span className="font-mono font-bold">#{order.order_number}</span></p>
          <p className="text-2xl font-bold text-green-600 mt-1">₪{order.amount_due?.toFixed(2)}</p>
        </div>
      </div>
    </div>
  )

  if (status === 'fail') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <div className="text-center bg-white rounded-2xl p-10 shadow-lg max-w-sm">
        <XCircle size={56} className="mx-auto mb-4 text-red-400"/>
        <h2 className="text-2xl font-bold text-gray-800">התשלום נכשל</h2>
        <p className="text-gray-500 mt-2">נסה שוב או צור קשר עם החנות</p>
        <button onClick={() => window.location.reload()}
          className="mt-5 w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700">
          נסה שוב
        </button>
      </div>
    </div>
  )

  // Payment page — show Tranzila iframe or demo
  const amount = order.amount_due ?? 0
  const APP_URL = import.meta.env.VITE_APP_URL ?? window.location.origin
  const successUrl = encodeURIComponent(`${APP_URL}/pay/${token}?status=success`)
  const failUrl    = encodeURIComponent(`${APP_URL}/pay/${token}?status=fail`)

  const tranzilaIframeUrl = TERMINAL
    ? `https://direct.tranzila.com/${TERMINAL}/iframenew.php?sum=${amount.toFixed(2)}&currency=1&tranmode=A&cred_type=1&myid=${order.order_number}&contact=${encodeURIComponent(order.customer_name)}&success_url=${successUrl}&fail_url=${failUrl}&nologo=1&lang=heb`
    : null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-dark-800 text-white p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center font-bold">B</div>
            <div>
              <p className="font-bold">באפלו מיטליז</p>
              <p className="text-xs text-gray-300">תשלום מאובטח</p>
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="p-5 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">הזמנה <span className="font-mono font-bold text-gray-800">#{order.order_number}</span></p>
              <p className="text-sm text-gray-500 mt-0.5">שלום, {order.customer_name}</p>
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-400">לתשלום</p>
              <p className="text-2xl font-bold text-brand-600">₪{amount.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Payment form */}
        <div className="p-5">
          {tranzilaIframeUrl ? (
            <>
              {!iframeReady && (
                <div className="text-center py-8 text-gray-400">
                  <CreditCard size={32} className="mx-auto mb-2 animate-pulse"/>
                  <p className="text-sm">טוען טופס תשלום...</p>
                </div>
              )}
              <iframe
                src={tranzilaIframeUrl}
                onLoad={() => setIframeReady(true)}
                className={`w-full border-0 rounded-xl transition-opacity ${iframeReady ? 'opacity-100' : 'opacity-0 h-0'}`}
                style={{ minHeight: iframeReady ? '420px' : '0' }}
                title="תשלום מאובטח"
              />
            </>
          ) : (
            /* Demo mode — no Tranzila terminal configured */
            <div className="text-center py-8">
              <CreditCard size={40} className="mx-auto mb-3 text-gray-300"/>
              <p className="font-bold text-gray-700">דמו — טרנזילה לא מחוברת עדיין</p>
              <p className="text-sm text-gray-400 mt-1">כאשר תחבר את מסוף הסליקה, כאן יופיע טופס תשלום מאובטח</p>
              <div className="mt-4 bg-gray-50 rounded-xl p-4 text-right">
                <p className="text-xs text-gray-400 mb-1">להפעלה — הוסף לקובץ .env:</p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded block text-gray-600">VITE_TRANZILA_TERMINAL=your_terminal</code>
              </div>
            </div>
          )}
        </div>

        {/* Security badge */}
        <div className="px-5 pb-5 flex items-center justify-center gap-2 text-xs text-gray-400">
          <ShieldCheck size={14} className="text-green-500"/>
          תשלום מאובטח SSL · מופעל על ידי טרנזילה
        </div>
      </div>
    </div>
  )
}
