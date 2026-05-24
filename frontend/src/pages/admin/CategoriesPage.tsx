import { useEffect, useState } from 'react'
import { Tag, Plus, Pencil, Trash2, X, Check, ToggleLeft, ToggleRight, GripVertical } from 'lucide-react'
import {
  adminGetCategories, adminCreateCategory, adminUpdateCategory, adminDeleteCategory,
  AdminCategory, CreateCategoryPayload
} from '../../lib/supabase'

// ── Toggle ─────────────────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} className="flex items-center gap-1 text-sm">
      {on
        ? <ToggleRight size={24} className="text-brand-600"/>
        : <ToggleLeft  size={24} className="text-gray-400"/>}
    </button>
  )
}

// ── Delete Confirm ─────────────────────────────────────────────────────────
function DelDialog({ name, onConfirm, onClose }: { name: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <h3 className="font-bold text-gray-800 text-lg mb-2">מחיקת קטגוריה</h3>
        <p className="text-gray-600 text-sm mb-6">האם למחוק את <strong>{name}</strong>? הפעולה לא ניתנת לביטול.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-sm hover:bg-gray-50">ביטול</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600">מחק</button>
        </div>
      </div>
    </div>
  )
}

// ── Category Modal ─────────────────────────────────────────────────────────
const EMPTY: CreateCategoryPayload = {
  name_he: '', slug: '', description_he: '', image_url: '', sort_order: 0, is_active: true
}

interface ModalProps {
  cat: AdminCategory | null
  onSave: (payload: CreateCategoryPayload, id?: string) => Promise<void>
  onClose: () => void
}
function CategoryModal({ cat, onSave, onClose }: ModalProps) {
  const [form, setForm] = useState<CreateCategoryPayload>(
    cat
      ? { name_he: cat.name_he, slug: cat.slug, description_he: cat.description_he ?? '', image_url: cat.image_url ?? '', sort_order: cat.sort_order, is_active: cat.is_active }
      : { ...EMPTY }
  )
  const [saving, setSaving] = useState(false)

  function sf<K extends keyof CreateCategoryPayload>(k: K, v: CreateCategoryPayload[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function submit() {
    if (!form.name_he.trim()) return
    setSaving(true)
    await onSave(form, cat?.id).catch(() => {})
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold text-gray-800 text-lg">{cat ? 'עריכת קטגוריה' : 'קטגוריה חדשה'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">שם הקטגוריה *</label>
              <input value={form.name_he} onChange={e => sf('name_he', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                placeholder="למשל: בקר"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Slug (URL)</label>
              <input value={form.slug} onChange={e => sf('slug', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 font-mono"
                placeholder="bekar (אופציונלי)"/>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">תיאור</label>
            <textarea rows={2} value={form.description_he} onChange={e => sf('description_he', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-300"
              placeholder="תיאור קצר של הקטגוריה"/>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">קישור לתמונה</label>
            <input value={form.image_url} onChange={e => sf('image_url', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              placeholder="https://..."/>
            {form.image_url && (
              <img src={form.image_url} alt="" className="mt-2 h-24 w-full object-cover rounded-xl border border-gray-100"/>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">סדר תצוגה</label>
              <input type="number" value={form.sort_order} onChange={e => sf('sort_order', Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"/>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <Toggle on={!!form.is_active} onChange={v => sf('is_active', v)}/>
                <span className="text-sm text-gray-600">פעיל</span>
              </label>
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-sm hover:bg-gray-50">ביטול</button>
          <button onClick={submit} disabled={saving || !form.name_he.trim()}
            className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 disabled:opacity-40 flex items-center justify-center gap-2">
            <Check size={16}/>{saving ? 'שומר...' : 'שמור'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const [cats, setCats] = useState<AdminCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [modalCat, setModalCat] = useState<AdminCategory | null | undefined>(undefined)
  const [deleteCat, setDeleteCat] = useState<AdminCategory | null>(null)
  async function load() {
    adminGetCategories().then(setCats).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleSave(payload: CreateCategoryPayload, id?: string) {
    if (id) {
      const updated = await adminUpdateCategory(id, payload)
      setCats(prev => prev.map(c => c.id === id ? updated : c))
    } else {
      const created = await adminCreateCategory(payload)
      setCats(prev => [created, ...prev])
    }
    setModalCat(undefined)
  }

  async function handleDelete(cat: AdminCategory) {
    await adminDeleteCategory(cat.id).catch(() => {})
    setCats(prev => prev.filter(c => c.id !== cat.id))
    setDeleteCat(null)
  }

  async function toggleActive(cat: AdminCategory) {
    const updated = await adminUpdateCategory(cat.id, { is_active: !cat.is_active }).catch(() => null)
    if (updated) setCats(prev => prev.map(c => c.id === cat.id ? updated : c))
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">קטגוריות</h1>
          <p className="text-sm text-gray-500 mt-1">{cats.length} קטגוריות</p>
        </div>
        <button onClick={() => setModalCat(null)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700">
          <Plus size={16}/>קטגוריה חדשה
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-brand-50 rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-500">סה"כ קטגוריות</p>
          <p className="text-2xl font-bold text-brand-600 mt-1">{cats.length}</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-500">פעילות</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{cats.filter(c => c.is_active).length}</p>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <Tag size={40} className="mx-auto mb-3 opacity-30"/>
          <p>טוען קטגוריות...</p>
        </div>
      ) : cats.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Tag size={40} className="mx-auto mb-3 opacity-30"/>
          <p>אין קטגוריות. צור קטגוריה ראשונה!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-[32px_1fr_160px_80px_80px_120px] gap-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <span></span><span>שם</span><span>Slug</span><span>סדר</span><span>פעיל</span><span></span>
          </div>

          {cats.map(cat => (
            <div key={cat.id}
              className="grid grid-cols-[32px_1fr_160px_80px_80px_120px] gap-4 items-center px-4 py-3 bg-white rounded-xl border border-gray-100 hover:border-gray-200">
              {/* Drag handle placeholder */}
              <GripVertical size={16} className="text-gray-300"/>

              {/* Name + image */}
              <div className="flex items-center gap-3 min-w-0">
                {cat.image_url
                  ? <img src={cat.image_url} alt="" className="w-10 h-10 object-cover rounded-lg border border-gray-100 shrink-0"/>
                  : <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center shrink-0">
                      <Tag size={16} className="text-brand-400"/>
                    </div>
                }
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{cat.name_he}</p>
                  {cat.description_he && <p className="text-xs text-gray-400 truncate">{cat.description_he}</p>}
                </div>
              </div>

              {/* Slug */}
              <code className="text-xs text-gray-500 font-mono truncate">{cat.slug}</code>

              {/* Sort order */}
              <span className="text-sm text-gray-600">{cat.sort_order}</span>

              {/* Active toggle */}
              <Toggle on={cat.is_active} onChange={() => toggleActive(cat)}/>

              {/* Actions */}
              <div className="flex items-center gap-2 justify-end">
                <button onClick={() => setModalCat(cat)}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-600">
                  <Pencil size={14}/>
                </button>
                <button onClick={() => setDeleteCat(cat)}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-red-50 hover:border-red-200 hover:text-red-500">
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {modalCat !== undefined && (
        <CategoryModal cat={modalCat} onSave={handleSave} onClose={() => setModalCat(undefined)}/>
      )}
      {deleteCat && (
        <DelDialog
          name={deleteCat.name_he}
          onConfirm={() => handleDelete(deleteCat)}
          onClose={() => setDeleteCat(null)}
        />
      )}
    </div>
  )
}
