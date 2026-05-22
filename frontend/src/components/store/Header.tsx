import { ShoppingCart, Phone, MapPin } from 'lucide-react'
import { useCartStore } from '../../store/cart'

interface HeaderProps {
  onCartOpen?: () => void
}

export default function Header({ onCartOpen }: HeaderProps) {
  const { itemCount, estimatedTotal, openCart } = useCartStore()
  const count = itemCount()
  const total = estimatedTotal()

  const handleCart = () => {
    openCart()
    onCartOpen?.()
  }

  return (
    <header className="bg-dark-800 text-white sticky top-0 z-40 shadow-lg">
      {/* Top bar */}
      <div className="bg-dark-900 text-xs text-brand-300 py-1.5">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <a href="tel:086500188" className="flex items-center gap-1 hover:text-brand-200">
            <Phone size={12} />
            <span>086500188</span>
          </a>
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            הגפן 3, באר שבע
          </span>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center font-bold text-white text-lg">
            B
          </div>
          <div>
            <div className="font-bold text-lg leading-tight">באפלו מיטליז</div>
            <div className="text-xs text-brand-300">כשר / חלק</div>
          </div>
        </a>

        {/* Cart button */}
        <button
          onClick={handleCart}
          className="relative flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-4 py-2.5 rounded-xl transition-all duration-200 active:scale-95"
        >
          <ShoppingCart size={20} />
          {count > 0 && (
            <>
              <span className="font-semibold text-sm">₪{total.toFixed(2)}</span>
              <span className="absolute -top-2 -left-2 bg-meat-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {count}
              </span>
            </>
          )}
          {count === 0 && <span className="text-sm">סל קניות</span>}
        </button>
      </div>
    </header>
  )
}
