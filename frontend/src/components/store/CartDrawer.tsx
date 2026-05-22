import { X, Trash2, ShoppingBag, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../../store/cart'

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateItem, estimatedTotal } = useCartStore()
  const navigate = useNavigate()
  const total = estimatedTotal()

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-dark-800 text-white">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <ShoppingBag size={20} />
            סל הקניות שלי
          </h2>
          <button onClick={closeCart} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <X size={22} />
          </button>
        </div>

        {/* Weighing notice */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-start gap-2">
          <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">
            <strong>שערוך בלבד</strong> — המחיר הסופי יחושב לאחר שקילת המוצרים.
          </p>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ShoppingBag size={48} className="mx-auto mb-3 opacity-30" />
              <p>הסל ריק</p>
              <p className="text-sm mt-1">הוסיפו מוצרים מהחנות</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className="card p-3 flex gap-3">
                {/* Image */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  {item.product.image_url ? (
                    <img src={item.product.image_url} alt={item.product.name_he} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🥩</div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-dark-800 truncate">{item.product.name_he}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.product.pricing_type === 'per_kg'
                      ? `${item.requested_weight_kg} ק"ג × ₪${item.product.price}`
                      : `${item.quantity} יח' × ₪${item.product.price}`}
                  </p>
                  <p className="font-bold text-brand-600 text-sm mt-1">
                    ~₪{item.estimated_price.toFixed(2)}
                  </p>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors self-start"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-dark-800">סה"כ שערוך:</span>
              <span className="text-xl font-bold text-brand-600">₪{total.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-400 text-center">* המחיר הסופי לפי שקילה</p>
            <button
              onClick={() => { closeCart(); navigate('/checkout') }}
              className="btn-primary w-full text-center"
            >
              המשך לרכישה
            </button>
          </div>
        )}
      </div>
    </>
  )
}
