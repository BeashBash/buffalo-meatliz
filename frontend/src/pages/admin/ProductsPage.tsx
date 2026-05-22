import { useEffect, useState } from 'react'
import { adminApi } from '../../lib/api'
import type { Product, Category } from '../../types'
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const EMPTY_FORM = {
  name_he: '', slug: '', description_he: '', image_url: '', pricing_type: 'per_kg',
  price: '', min_weight_kg: '0.5', max_weight_kg: '10', weight_step_kg: '0.5',
  is_available: true, is_featured: false, badge: '', sort_order: '0', category_id: '',
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    adminApi.getAdminProducts().then((r) => setProducts(r.data))
    adminApi.getAllCategories().then((r) => setCategories(r.data))
  }, [])

  const resetForm = () => { setForm({ ...EMPTY_FORM }); setEditId(null); setShowForm(false) }

  const handleEdit = (p: Product) => {
    setForm({
      name_he: p.name_he, slug: p.slug, description_he: p.description_he || '',
      image_url: p.image_url || '', pricing_type: p.pricing_type,
      price: String(p.price), min_weight_kg: String(p.min_weight_kg || 0.5),
      max_weight_kg: String(p.max_weight_kg || 10), weight_step_kg: String(p.weight_step_kg || 0.5),
      is_available: p.is_available, is_featured: p.is_featured,
      badge: p.badge || '', sort_order: String(p.sort_order),
      category_id: p.category_id || '',
    })
    setEditId(p.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSave = async () => {
    if (!form.name_he || !form.price) { toast.error('נא למלא שם ומחיר'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        slug: form.slug || form.name_he.replace(/\s+/g, '-').toLowerCase(),
        price: parseFloat(form.price),
        min_weight_kg: form.pricing_type === 'per_kg' ? parseFloat(form.min_weight_kg) : undefined,
        max_weight_kg: form.pricing_type === 'per_kg' ? parseFloat(form.max_weight_kg) : undefined,
        weight_step_kg: form.pricing_type === 'per_kg' ? parseFloat(form.weight_step_kg) : undefined,
        sort_order: parseInt(form.sort_order),
        category_id: form.category_id || undefined,
        badge: form.badge || undefined,
        description_he: form.description_he || undefined,
        image_url: form.image_url || undefined,
      }
      if (editId) {
        const { data } = await adminApi.updateProduct(editId, payload)
        setProducts((prev) => prev.map((p) => (p.id === editId ? data : p)))
        toast.success('מוצר עודכן')
      } else {
        const { data } = await adminApi.createProduct(payload)
        setProducts((prev) => [...prev, data])
        toast.success('מוצר נוסף')
      }
      resetForm()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'שגיאה בשמירה')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleAvailable = async (p: Product) => {
    try {
      const { data } = await adminApi.updateProduct(p.id, { is_available: !p.is_available })
      setProducts((prev) => prev.map((x) => (x.id === p.id ? data : x)))
    } catch { toast.error('שגיאה') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-800">מוצרים</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          מוצר חדש
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-5 space-y-4 border-2 border-brand-300">
          <h2 className="font-bold text-dark-800">{editId ? 'עריכת מוצר' : 'מוצר חדש'}</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-1">שם המוצר (עברית) *</label>
              <input className="input-field" value={form.name_he} onChange={(e) => setForm({ ...form, name_he: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">קטגוריה</label>
              <select className="input-field" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">ללא קטגוריה</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name_he}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">סוג תמחור</label>
              <select className="input-field" value={form.pricing_type} onChange={(e) => setForm({ ...form, pricing_type: e.target.value })}>
                <option value="per_kg">לפי ק"ג</option>
                <option value="per_unit">לפי יחידה</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">מחיר (₪) *</label>
              <input type="number" step="0.01" className="input-field" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">תג (מבצע/טרי/מהדרין)</label>
              <input className="input-field" placeholder="טרי" value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} />
            </div>
            {form.pricing_type === 'per_kg' && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">משקל מינ' (ק"ג)</label>
                  <input type="number" step="0.1" className="input-field" value={form.min_weight_kg} onChange={(e) => setForm({ ...form, min_weight_kg: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">משקל מקס' (ק"ג)</label>
                  <input type="number" step="0.5" className="input-field" value={form.max_weight_kg} onChange={(e) => setForm({ ...form, max_weight_kg: e.target.value })} />
                </div>
              </>
            )}
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-1">תמונה (URL)</label>
              <input className="input-field" placeholder="https://..." value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-1">תיאור</label>
              <textarea className="input-field resize-none" rows={2} value={form.description_he} onChange={(e) => setForm({ ...form, description_he: e.target.value })} />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} />
                <span className="text-sm">זמין למכירה</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
                <span className="text-sm">מוצר מומלץ</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'שומר...' : 'שמור'}</button>
            <button onClick={resetForm} className="btn-secondary">ביטול</button>
          </div>
        </div>
      )}

      {/* Products list */}
      <div className="space-y-2">
        {products.map((p) => (
          <div key={p.id} className={clsx('card p-4 flex items-center gap-3', !p.is_available && 'opacity-60')}>
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
              {p.image_url ? <img src={p.image_url} alt={p.name_he} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🥩</div>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-dark-800 truncate">{p.name_he}</p>
                {p.badge && <span className="badge bg-red-100 text-red-700 text-xs">{p.badge}</span>}
              </div>
              <p className="text-sm text-gray-500">{p.category?.name_he || 'ללא קטגוריה'}</p>
              <p className="text-sm font-bold text-brand-600">₪{p.price}{p.pricing_type === 'per_kg' ? '/ק"ג' : '/יחידה'}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => handleToggleAvailable(p)} className={clsx('p-2 rounded-lg', p.is_available ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100')}>
                {p.is_available ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <button onClick={() => handleEdit(p)} className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg">
                <Edit2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
