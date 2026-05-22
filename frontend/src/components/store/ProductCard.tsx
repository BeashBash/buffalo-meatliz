import { useState } from 'react'
import { Plus, Minus, ShoppingCart } from 'lucide-react'
import { useCartStore } from '../../store/cart'
import type { Product } from '../../types'
import clsx from 'clsx'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
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

  const currentValue = isPerKg ? weight : qty
  const estimatedPrice = product.price * currentValue

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
        {/* Badge */}
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
          ₪{product.price.toFixed(2)}
          <span className="text-sm font-normal text-gray-500 mr-1">
            {isPerKg ? '/ ק"ג' : '/ יחידה'}
          </span>
        </div>

        {/* Weight / Qty selector */}
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

            {/* Estimated price */}
            <div className="text-sm text-gray-500 text-center">
              שערוך: <span className="font-semibold text-dark-800">₪{estimatedPrice.toFixed(2)}</span>
              {isPerKg && <span className="text-xs mr-1">(לפי שקילה)</span>}
            </div>

            {/* Add to cart */}
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
