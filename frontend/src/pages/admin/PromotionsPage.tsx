import { useEffect, useState } from 'react'
import { adminApi } from '../../lib/api'
import { Plus, Trash2, Tag } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

interface Promotion {
  id: string
  code?: string
  name_he: string
  description_he?: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_amount: number
  max_uses?: number
  current_uses: number
  is_active: boolean
}

export default function PromotionsPage() {
  const [promos, setPromos] = useState<Promotion[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name_he: '', code: '', discount_type: 'percentage', discount_value: '10',
    min_order_amount: '0', max_uses: '', description_he: '',
  })

  useEffect(() => {
    adminApi.getPromotions().then((r) => setPromos(r.data))
  }, [])

  const handleSave = async () => {
    if (!form.name_he || !form.discount_value) { toast.error('נא למלא שם והנחה'); return }
    setSaving(true)
    try {
      const { data } = await adminApi.createPromotion({
        name_he: form.name_he,
        code: form.code || undefined,
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        min_order_amount: parseFloat(form.min_order_amount) || 0,
        max_uses: form.max_uses ? parseInt(form.max_uses) : undefined,
        description_he: form.description_he || undefined,
        is_active: true,
      })
      setPromos((prev) => [data, ...prev])
      setShowForm(false)
      setForm({ name_he: '', code: '', discount_type: 'percentage', discount_value: '10', min_order_amount: '0', max_uses: '', description_he: '' })
      toast.success('מבצע נוסף')
    } catch { toast.error('שגיאה') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('למחוק את המבצע?')) return
    await adminApi.deletePromotion(id)
    setPromos((prev) => prev.filter((p) => p.id !== id))
    toast.success('מבצע הוסר')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-800 flex items-center gap-2"><Tag size={22} /> מבצעים וקופונים</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2"><Plus size={18} /> מבצע חדש</button>
      </div>

      {showForm && (
        <div className="card p-5 space-y-4 border-2 border-brand-300">
          <h2 className="font-bold text-dark-800">מבצע / קופון חדש</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-1">שם המבצע *</label>
              <input className="input-field" placeholder="מבצע קיץ 10%" value={form.name_he} onChange={(e) => setForm({ ...form, name_he: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">קוד קופון (אופציונלי)</label>
              <input className="input-field" placeholder="SUMMER10" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">סוג הנחה</label>
              <select className="input-field" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
                <option value="percentage">אחוז (%)</option>
                <option value="fixed">סכום קבוע (₪)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">ערך הנחה *</label>
              <input type="number" className="input-field" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">מינ' הזמנה (₪)</label>
              <input type="number" className="input-field" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">מקס' שימושים</label>
              <input type="number" className="input-field" placeholder="ללא הגבלה" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? '...' : 'שמור'}</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">ביטול</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {promos.map((p) => (
          <div key={p.id} className={clsx('card p-4 flex items-center gap-4', !p.is_active && 'opacity-50')}>
            <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
              <Tag size={18} className="text-brand-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-bold text-dark-800">{p.name_he}</p>
                {p.code && <span className="badge bg-blue-100 text-blue-700">{p.code}</span>}
                {!p.is_active && <span className="badge bg-red-100 text-red-700">לא פעיל</span>}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {p.discount_type === 'percentage' ? `${p.discount_value}% הנחה` : `₪${p.discount_value} הנחה`}
                {p.min_order_amount > 0 && ` · מינ' ₪${p.min_order_amount}`}
                {p.max_uses && ` · ${p.current_uses}/${p.max_uses} שימושים`}
              </p>
            </div>
            <button onClick={() => handleDelete(p.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {promos.length === 0 && (
          <div className="card p-12 text-center text-gray-400">אין מבצעים פעילים</div>
        )}
      </div>
    </div>
  )
}
