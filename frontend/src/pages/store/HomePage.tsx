import { useState, useEffect } from 'react'
import { storeApi } from '../../lib/api'
import type { Product, Category } from '../../types'
import Header from '../../components/store/Header'
import ProductCard from '../../components/store/ProductCard'
import CartDrawer from '../../components/store/CartDrawer'
import { useCartStore } from '../../store/cart'

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const { openCart } = useCartStore()

  useEffect(() => {
    Promise.all([storeApi.getCategories(), storeApi.getProducts()])
      .then(([catRes, prodRes]) => {
        setCategories(catRes.data)
        setProducts(prodRes.data)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (activeCategory === 'all') {
      storeApi.getProducts().then((r) => setProducts(r.data))
    } else {
      storeApi.getProducts(activeCategory).then((r) => setProducts(r.data))
    }
  }, [activeCategory])

  return (
    <div className="min-h-screen bg-brand-50">
      <Header onCartOpen={openCart} />
      <CartDrawer />

      {/* Hero Banner */}
      <div className="relative bg-dark-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-l from-dark-900 to-transparent opacity-70" />
        <div
          className="relative min-h-[220px] md:min-h-[300px] bg-cover bg-center flex items-end"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=1200&q=80')" }}
        >
          <div className="p-6 md:p-10 max-w-xl">
            <h1 className="text-2xl md:text-4xl font-bold mb-2 drop-shadow">באפלו מיטליז</h1>
            <p className="text-brand-200 text-sm md:text-base mb-1">אטליז כשר/חלק | באר שבע</p>
            <p className="text-xs text-gray-300">🥩 בשר טרי איכותי • המחיר הסופי לפי שקילה</p>
          </div>
        </div>
      </div>

      {/* Category Nav */}
      <div className="bg-white border-b border-gray-100 sticky top-[68px] z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2 no-scrollbar">
            <button
              onClick={() => setActiveCategory('all')}
              className={`shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                activeCategory === 'all'
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              כל המוצרים
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.slug)}
                className={`shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  activeCategory === cat.slug
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat.name_he}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-8 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">🥩</p>
            <p>אין מוצרים זמינים כעת</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-dark-800 text-white py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="font-bold text-lg mb-1">באפלו מיטליז</p>
          <p className="text-brand-300 text-sm">הגפן 3, באר שבע | 086500188</p>
          <p className="text-gray-500 text-xs mt-3">© 2024 באפלו מיטליז. כל הזכויות שמורות.</p>
        </div>
      </footer>
    </div>
  )
}
