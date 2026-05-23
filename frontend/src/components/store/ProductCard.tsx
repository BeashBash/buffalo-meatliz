import { useState } from 'react'
import { Plus, Minus, ShoppingCart } from 'lucide-react'
import { useCartStore } from '../../store/cart'
import type { Product } from '../../types'
import clsx from 'clsx'

interface ProductCardProps {
  product: Product
  dark?: boolean
}

const D = {
  bg2: '#1a1919',
  bg3: '#222121',
  border: '#2e2d2d',
}

export default function ProductCard({ product, dark = false }: ProductCardProps) {
  const { addItem, items } = useCartStore()
  const existingItem = items.find((i) => i.product.id === product.id)

  const [weight, setWeight] = useState<number>(
    existingItem?.requested_weight_kg || product.min_weight_kg || 0.5
  )
  const [qty, setQty] = useState<number>(existingItem?.quantity || 1)
  const [added, setAdded] = useState(false)

  const isPerKg = product.pricing_type === 'per_kg'
  const minW = product.min_weight_kg || 0.5
  const maxW = product.max_weight_kg || 10
  const step = product.weight_step_kg || 0.5
  const price = Number(product.price)

  const currentValue = isPerKg ? weight : qty
  const estimatedPrice = price * currentValue

  const increment = () => {
    if (isPerKg) {
      setWeight((w) => Math.min(+(w + step).toFixed(3), maxW))
    } else {
      setQty((q) => q + 1)
    }
  }

  const decrement = () => {
    if (isPerKg) {
      setWeight((w) => Math.max(+(w - step).toFixed(3), minW))
    } else {
      setQty((q) => Math.max(1, q - 1))
    }
  }

  const handleAdd = () => {
    addItem(product, isPerKg ? weight : qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  if (dark) {
    return (
      <div
        className="group flex flex-col border transition-all duration-300 overflow-hidden"
        style={{ backgroundColor: D.bg2, borderColor: D.border, borderRadius: '4px' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#a8501e' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = D.border }}
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-black/20">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name_he}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl" style={{ backgroundColor: D.bg3 }}>
              🥩
            </div>
          )}
          {product.badge && (
            <span className="absolute top-2 right-2 bg-brand-600 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider" style={{ borderRadius: '2px' }}>
              {product.badge}
            </span>
          )}
          {!product.is_available && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <span className="text-white font-bold text-sm uppercase tracking-widest">אזל מהמלאי</span>
            </div>
          )}
          {/* Price overlay bottom */}
          <div className="absolute bottom-0 left-0 right-0 py-2 px-3 text-right" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)' }}>
            <span className="text-brand-400 font-black text-lg">
              ₪{price.toFixed(2)}
              <span className="text-xs font-normal text-gray-400 mr-1">{isPerKg ? '/ ק"ג' : '/ יחידה'}</span>
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1 gap-3 text-right">
          <div>
            <h3 className="font-black text-white text-sm leading-tight uppercase tracking-wide">{product.name_he}</h3>
            {product.description_he && (
              <p className="text-gray-600 text-xs mt-1 line-clamp-2 leading-relaxed">{product.description_he}</p>
            )}
          </div>

          {product.is_available && (
            <>
              {/* Weight / Qty selector */}
              <div className="flex items-center justify-between border rounded-sm p-1" style={{ borderColor: D.border }}>
                <button
                  onClick={decrement}
                  className="w-8 h-8 flex items-center justify-center hover:bg-brand-600 text-gray-400 hover:text-white transition-all rounded-sm"
                >
                  <Minus size={14} />
                </button>
                <span className="font-bold text-white text-sm">
                  {isPerKg ? `${weight} ק"ג` : `${qty} יח'`}
                </span>
                <button
                  onClick={increment}
                  className="w-8 h-8 flex items-center justify-center hover:bg-brand-600 text-gray-400 hover:text-white transition-all rounded-sm"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Estimated price */}
              <div className="text-xs text-gray-600 text-center">
                סה"כ משוער: <span className="font-bold text-gray-400">₪{estimatedPrice.toFixed(2)}</span>
                {isPerKg && <span className="mr-1 text-gray-700">(לפי שקילה)</span>}
              </div>

              {/* Add to cart */}
              <button
                onClick={handleAdd}
                className={clsx(
                  'w-full flex items-center justify-center gap-2 py-2.5 font-bold text-xs uppercase tracking-widest transition-all rounded-sm',
                  added
                    ? 'bg-green-700 text-white'
                    : 'bg-brand-600 hover:bg-brand-500 text-white active:scale-95'
                )}
              >
                {added ? <>✓ נוסף לסל</> : <><ShoppingCart size={15} /> הוסף לסל</>}
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // Light mode (default)
  return (
    <div className="card group hover:shadow-md transition-shadow duration-200 flex flex-col">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name_he}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-brand-50 text-6xl">
            🥩
          </div>
        )}
        {product.badge && (
          <span className="absolute top-2 right-2 bg-meat-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
            {product.badge}
          </span>
        )}
        {!product.is_available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold">אזל מהמלאי</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        <div>
          <h3 className="font-bold text-dark-800 text-base leading-tight">{product.name_he}</h3>
          {product.description_he && (
            <p className="text-gray-500 text-sm mt-1 line-clamp-2">{product.description_he}</p>
          )}
        </div>

        {/* Price */}
        <div className="font-bold text-brand-600 text-lg">
          ₪{price.toFixed(2)}
          <span className="text-sm font-normal text-gray-500 mr-1">
            {isPerKg ? '/ ק"ג' : '/ יחידה'}
          </span>
        </div>

        {product.is_available && (
          <>
            <div className="flex items-center justify-between bg-brand-50 rounded-xl p-1">
              <button
                onClick={decrement}
                className="w-9 h-9 rounded-lg bg-white shadow-sm hover:bg-brand-100 flex items-center justify-center transition-colors"
              >
                <Minus size={16} className="text-brand-600" />
              </button>
              <span className="font-bold text-dark-800 text-sm">
                {isPerKg ? `${weight} ק"ג` : `${qty} יח'`}
              </span>
              <button
                onClick={increment}
                className="w-9 h-9 rounded-lg bg-white shadow-sm hover:bg-brand-100 flex items-center justify-center transition-colors"
              >
                <Plus size={16} className="text-brand-600" />
              </button>
            </div>

            <div className="text-sm text-gray-500 text-center">
              שערוך: <span className="font-semibold text-dark-800">₪{estimatedPrice.toFixed(2)}</span>
              {isPerKg && <span className="text-xs mr-1">(לפי שקילה)</span>}
            </div>

            <button
              onClick={handleAdd}
              className={clsx(
                'btn-primary w-full flex items-center justify-center gap-2',
                added && 'bg-green-600 hover:bg-green-600'
              )}
            >
              {added ? (
                <>✓ נוסף לסל</>
              ) : (
                <>
                  <ShoppingCart size={18} />
                  הוסף לסל
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
