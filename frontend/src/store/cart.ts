import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Product } from '../types'

interface CartStore {
  items: CartItem[]
  isOpen: boolean

  addItem: (product: Product, weightOrQty: number) => void
  removeItem: (productId: string) => void
  updateItem: (productId: string, weightOrQty: number) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void

  estimatedTotal: () => number
  itemCount: () => number
}

function calcEstimatedPrice(product: Product, weightOrQty: number): number {
  return Math.round(product.price * weightOrQty * 100) / 100
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, weightOrQty) => {
        const existing = get().items.find((i) => i.product.id === product.id)
        if (existing) {
          set((s) => ({
            items: s.items.map((i) =>
              i.product.id === product.id
                ? {
                    ...i,
                    requested_weight_kg: product.pricing_type === 'per_kg' ? weightOrQty : undefined,
                    quantity: product.pricing_type === 'per_unit' ? weightOrQty : i.quantity,
                    estimated_price: calcEstimatedPrice(product, weightOrQty),
                  }
                : i
            ),
            isOpen: true,
          }))
        } else {
          const newItem: CartItem = {
            product,
            requested_weight_kg: product.pricing_type === 'per_kg' ? weightOrQty : undefined,
            quantity: product.pricing_type === 'per_unit' ? weightOrQty : 1,
            estimated_price: calcEstimatedPrice(product, weightOrQty),
          }
          set((s) => ({ items: [...s.items, newItem], isOpen: true }))
        }
      },

      removeItem: (productId) =>
        set((s) => ({ items: s.items.filter((i) => i.product.id !== productId) })),

      updateItem: (productId, weightOrQty) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.product.id === productId
              ? {
                  ...i,
                  requested_weight_kg: i.product.pricing_type === 'per_kg' ? weightOrQty : undefined,
                  quantity: i.product.pricing_type === 'per_unit' ? weightOrQty : i.quantity,
                  estimated_price: calcEstimatedPrice(i.product, weightOrQty),
                }
              : i
          ),
        })),

      clearCart: () => set({ items: [] }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      estimatedTotal: () =>
        get().items.reduce((sum, i) => sum + i.estimated_price, 0),
      itemCount: () => get().items.length,
    }),
    { name: 'buffalo-cart' }
  )
)
