import { useParams, Link } from 'react-router-dom'
import { CheckCircle, Clock, MessageCircle } from 'lucide-react'

export default function OrderSuccessPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>()

  return (
    <div className="min-h-screen bg-brand-50 flex flex-col items-center justify-center p-4">
      <div className="card max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={40} className="text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-dark-800 mb-2">ההזמנה התקבלה! 🥩</h1>
        <p className="text-gray-500 mb-4">תודה על הזמנתך מאיתנו</p>

        <div className="bg-brand-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-500">מספר הזמנה</p>
          <p className="text-2xl font-bold text-brand-600 mt-1">{orderNumber}</p>
        </div>

        <div className="space-y-3 text-sm text-right mb-6">
          <div className="flex items-start gap-3">
            <Clock size={18} className="text-brand-500 shrink-0 mt-0.5" />
            <p className="text-gray-600">ההזמנה שלך בטיפול — הצוות שלנו יכין ויישקל את המוצרים.</p>
          </div>
          <div className="flex items-start gap-3">
            <MessageCircle size={18} className="text-green-500 shrink-0 mt-0.5" />
            <p className="text-gray-600">לאחר השקילה תקבלו WhatsApp עם המחיר הסופי וקישור לתשלום.</p>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            to={`/track/${orderNumber}`}
            className="btn-secondary w-full block text-center"
          >
            עקוב אחר ההזמנה
          </Link>
          <Link to="/" className="btn-primary w-full block text-center">
            חזרה לחנות
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-4">
          שאלות? <a href="https://wa.me/972509989893" className="text-green-600 underline">WhatsApp</a> | <a href="tel:086500188" className="text-brand-600 underline">086500188</a>
        </p>
      </div>
    </div>
  )
}
