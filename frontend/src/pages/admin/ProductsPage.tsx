import { useEffect, useState, useRef } from 'react'
import {
  Plus, Search, Edit2, Trash2, Eye, EyeOff,
  Star, StarOff, X, ChevronDown, ImageOff,
  AlertTriangle, Check, Package, Filter,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  adminGetProducts, adminGetCategories,
  adminCreateProduct, adminUpdateProduct, adminDeleteProduct,
  type AdminProduct, type AdminCategory, type CreateProductPayload,
} from '../../lib/supabase'

const EMPTY: CreateProductPayload = {
  name_he: '', category_id: '', pricing_type: 'per_kg',
  price: 0, description_he: '', image_url: '',
  min_weight_kg: 0.5, max_weight_kg: 10, weight_step_kg: 0.5,
  is_available: true, is_featured: false, badge: '', sort_order: 0,
}
const BADGES = ['', 'טרי', 'מבצע', 'מהדרין', 'חדש', 'פופולרי', 'מומלץ']
const CLS_BTN_ON  = 'flex-1 py-2 rounded-lg text-sm font-bold border bg-brand-500 text-white border-brand-500'
const CLS_BTN_OFF = 'flex-1 py-2 rounded-lg text-sm font-bold border bg-white text-gray-600 border-gray-200'

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-2xl font-black text-gray-800">{value}</p>
      {sub && <p className="text-xs text-brand-500 font-medium">{sub}</p>}
    </div>
  )
}

function ImgPreview({ url }: { url: string }) {
  const [ok, setOk] = useState(false)
  const [err, setErr] = useState(false)
  useEffect(() => { setOk(false); setErr(false) }, [url])
  if (!url) return null
  return (
    <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 w-full h-36 flex items-center justify-center overflow-hidden">
      {err
        ? <div className="flex flex-col items-center gap-1 text-gray-400"><ImageOff size={28}/><span className="text-xs">לא נטען</span></div>
        : <img src={url} alt="preview" className="w-full h-full object-contain" style={{display: ok ? 'block' : 'none'}} onLoad={()=>setOk(true)} onError={()=>setErr(true)}/>
      }
      {!ok && !err && <div className="text-xs text-gray-400 animate-pulse">טוען...</div>}
    </div>
  )
}

function DelDialog({ product, onConfirm, onCancel }: { product: AdminProduct; onConfirm: ()=>void; onCancel: ()=>void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={26} className="text-red-500"/>
        </div>
        <h3 className="font-bold text-gray-800 text-lg mb-1">מחיקת מוצר</h3>
        <p className="text-gray-500 text-sm mb-5">האם למחוק את <strong>{product.name_he}</strong>? פעולה זו אינה ניתנת לביטול.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 btn-secondary">ביטול</button>
          <button onClick={onConfirm} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg">מחק</button>
        </div>
      </div>
    </div>
  )
}

function Toggle({ on, onToggle, color, label }: { on: boolean; onToggle: ()=>void; color: string; label: string }) {
  const track = on ? `relative w-11 h-6 rounded-full transition-colors ${color}` : 'relative w-11 h-6 rounded-full transition-colors bg-gray-200'
  const knob  = on ? 'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform translate-x-5' : 'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform translate-x-1'
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div className={track} onClick={onToggle}><div className={knob}/></div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </label>
  )
}

function ProductModal({ editProduct, categories, onClose, onSaved }: {
  editProduct: AdminProduct | null
  categories: AdminCategory[]
  onClose: () => void
  onSaved: (p: AdminProduct) => void
}) {
  const isEdit  = !!editProduct
  const nameRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<CreateProductPayload>(() => editProduct ? {
    name_he: editProduct.name_he, category_id: editProduct.category_id || '',
    pricing_type: editProduct.pricing_type, price: editProduct.price,
    description_he: editProduct.description_he || '', image_url: editProduct.image_url || '',
    min_weight_kg: editProduct.min_weight_kg ?? 0.5, max_weight_kg: editProduct.max_weight_kg ?? 10,
    weight_step_kg: editProduct.weight_step_kg ?? 0.5, is_available: editProduct.is_available,
    is_featured: editProduct.is_featured, badge: editProduct.badge || '', sort_order: editProduct.sort_order ?? 0,
  } : { ...EMPTY })
  const [saving, setSaving] = useState(false)
  useEffect(() => { nameRef.current?.focus() }, [])

  function sf<K extends keyof CreateProductPayload>(k: K, v: CreateProductPayload[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  const handleSave = async () => {
    if (!form.name_he.trim()) { toast.error('נא להזין שם מוצר'); return }
    if (!form.price || Number(form.price) <= 0) { toast.error('נא להזין מחיר תקין'); return }
    setSaving(true)
    try {
      const isKg = form.pricing_type === 'per_kg'
      const payload: CreateProductPayload = {
        name_he: form.name_he.trim(), category_id: form.category_id,
        pricing_type: form.pricing_type, price: Number(form.price),
        description_he: form.description_he || undefined,
        image_url: form.image_url || undefined,
        min_weight_kg:  isKg ? Number(form.min_weight_kg)  : undefined,
        max_weight_kg:  isKg ? Number(form.max_weight_kg)  : undefined,
        weight_step_kg: isKg ? Number(form.weight_step_kg) : undefined,
        is_available: form.is_available, is_featured: form.is_featured,
        badge: form.badge || undefined, sort_order: Number(form.sort_order),
      }
      const result = isEdit && editProduct
        ? await adminUpdateProduct(editProduct.id, payload)
        : await adminCreateProduct(payload)
      toast.success(isEdit ? 'מוצר עודכן' : 'מוצר נוסף')
      onSaved(result)
    } catch (e: unknown) {
      toast.error('שגיאה: ' + (e instanceof Error ? e.message : 'נסה שוב'))
    } finally { setSaving(false) }
  }

  const priceLabel = form.pricing_type === 'per_kg' ? 'מחיר לקג (₪) *' : 'מחיר ליחידה (₪) *'

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X size={20}/>
          </button>
          <h2 className="font-black text-gray-800 text-lg">
            {isEdit ? 'עריכת מוצר — ' + editProduct?.name_he : 'הוספת מוצר חדש'}
          </h2>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">שם המוצר (עברית) *</label>
            <input ref={nameRef} className="input-field text-lg font-semibold"
              placeholder="לדוגמה: אנטריקוט פרמיום"
              value={form.name_he} onChange={e => sf('name_he', e.target.value)}/>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">קטגוריה</label>
              <div className="relative">
                <select className="input-field appearance-none pr-3 pl-8"
                  value={form.category_id} onChange={e => sf('category_id', e.target.value)}>
                  <option value="">ללא קטגוריה</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name_he}</option>)}
                </select>
                <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">סוג תמחור</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => sf('pricing_type', 'per_kg')}
                  className={form.pricing_type === 'per_kg' ? CLS_BTN_ON : CLS_BTN_OFF}>
                  לפי קילוגרם
                </button>
                <button type="button" onClick={() => sf('pricing_type', 'per_unit')}
                  className={form.pricing_type === 'per_unit' ? CLS_BTN_ON : CLS_BTN_OFF}>
                  לפי יחידה
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">{priceLabel}</label>
              <input type="number" step="0.5" min="0" className="input-field"
                value={form.price || ''} onChange={e => sf('price', parseFloat(e.target.value) || 0)}/>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">תג מוצר</label>
              <div className="relative">
                <select className="input-field appearance-none pr-3 pl-8"
                  value={form.badge} onChange={e => sf('badge', e.target.value)}>
                  {BADGES.map(b => <option key={b} value={b}>{b || '— ללא תג —'}</option>)}
                </select>
                <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">סדר מיון</label>
              <input type="number" min="0" className="input-field"
                value={form.sort_order} onChange={e => sf('sort_order', parseInt(e.target.value) || 0)}/>
            </div>
          </div>

          {form.pricing_type === 'per_kg' && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
              <p className="text-xs font-bold text-orange-700 mb-3">⚖️ הגדרות שקילה</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">מינימלי (קג)</label>
                  <input type="number" step="0.1" min="0" className="input-field text-sm"
                    value={form.min_weight_kg} onChange={e => sf('min_weight_kg', parseFloat(e.target.value) || 0)}/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">מקסימלי (קג)</label>
                  <input type="number" step="0.5" min="0" className="input-field text-sm"
                    value={form.max_weight_kg} onChange={e => sf('max_weight_kg', parseFloat(e.target.value) || 0)}/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">קפיצה (קג)</label>
                  <input type="number" step="0.1" min="0" className="input-field text-sm"
                    value={form.weight_step_kg} onChange={e => sf('weight_step_kg', parseFloat(e.target.value) || 0)}/>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">תמונה (URL)</label>
            <input className="input-field" placeholder="https://example.com/image.jpg"
              value={form.image_url} onChange={e => sf('image_url', e.target.value)}/>
            <ImgPreview url={form.image_url || ''}/>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">תיאור מוצר</label>
            <textarea className="input-field resize-none" rows={3} placeholder="תיאור קצר..."
              value={form.description_he} onChange={e => sf('description_he', e.target.value)}/>
          </div>

          <div className="flex gap-6">
            <Toggle on={form.is_available ?? true} onToggle={() => sf('is_available', !form.is_available)} color="bg-green-500" label="זמין למכירה"/>
            <Toggle on={form.is_featured ?? false} onToggle={() => sf('is_featured', !form.is_featured)} color="bg-amber-400" label="מוצר מומלץ"/>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary">ביטול</button>
          <button onClick={handleSave} disabled={saving}
            className="btn-primary flex items-center gap-2 min-w-28 justify-center">
            {saving
              ? <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>
              : <Check size={16}/>}
            {saving ? 'שומר...' : isEdit ? 'שמור שינויים' : 'הוסף מוצר'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  const [products, setProducts]     = useState<AdminProduct[]>([])
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [filterCat, setFilterCat]   = useState('')
  const [filterStatus, setFilterStatus] = useState<'' | 'available' | 'unavailable'>('')
  const [modalOpen, setModalOpen]   = useState(false)
  const [editTarget, setEditTarget] = useState<AdminProduct | null>(null)
  const [delTarget, setDelTarget]   = useState<AdminProduct | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [prods, cats] = await Promise.all([adminGetProducts(), adminGetCategories()])
      setProducts(prods); setCategories(cats)
    } catch { toast.error('שגיאה בטעינת המוצרים') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    const ms = !q || p.name_he.includes(q) || (p.category_name||'').includes(q) || (p.badge||'').includes(q)
    const mc = !filterCat || p.category_id === filterCat
    const mv = !filterStatus || (filterStatus === 'available' ? p.is_available : !p.is_available)
    return ms && mc && mv
  })

  const stats = {
    total:     products.length,
    available: products.filter(p => p.is_available).length,
    featured:  products.filter(p => p.is_featured).length,
    cats:      categories.length,
  }

  const toggleAvail = async (p: AdminProduct) => {
    try {
      const u = await adminUpdateProduct(p.id, { is_available: !p.is_available })
      setProducts(prev => prev.map(x => x.id === p.id ? u : x))
    } catch { toast.error('שגיאה') }
  }
  const toggleFeat = async (p: AdminProduct) => {
    try {
      const u = await adminUpdateProduct(p.id, { is_featured: !p.is_featured })
      setProducts(prev => prev.map(x => x.id === p.id ? u : x))
    } catch { toast.error('שגיאה') }
  }
  const handleSaved = (updated: AdminProduct) => {
    setProducts(prev => {
      const ex = prev.find(x => x.id === updated.id)
      return ex ? prev.map(x => x.id === updated.id ? updated : x) : [updated, ...prev]
    })
    setModalOpen(false); setEditTarget(null)
  }
  const handleDelete = async () => {
    if (!delTarget) return
    try {
      await adminDeleteProduct(delTarget.id)
      setProducts(prev => prev.filter(x => x.id !== delTarget.id))
      toast.success('המוצר נמחק')
    } catch { toast.error('שגיאה במחיקה') }
    setDelTarget(null)
  }
  const openEdit = (p: AdminProduct) => { setEditTarget(p); setModalOpen(true) }
  const openNew  = () => { setEditTarget(null); setModalOpen(true) }

  const ROW = 'grid grid-cols-[56px_1fr_140px_100px_90px_90px_120px] gap-3 px-4'

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800">ניהול מוצרים</h1>
          <p className="text-sm text-gray-500 mt-0.5">{products.length} מוצרים במערכת</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={18}/> הוסף מוצר
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard label="סה״כ מוצרים" value={stats.total}/>
        <StatCard label="זמינים למכירה" value={stats.available} sub={(stats.total - stats.available) + ' לא זמינים'}/>
        <StatCard label="מוצרים מומלצים" value={stats.featured}/>
        <StatCard label="קטגוריות" value={stats.cats}/>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input className="input-field pr-9 py-2 text-sm" placeholder="חיפוש שם, קטגוריה, תג..."
            value={search} onChange={e => setSearch(e.target.value)}/>
          {search && <button onClick={() => setSearch('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={13}/></button>}
        </div>
        <div className="relative">
          <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
          <select className="input-field appearance-none pr-8 pl-6 py-2 text-sm" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="">כל הקטגוריות</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name_he}</option>)}
          </select>
          <ChevronDown size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {([['', 'הכל'], ['available', 'זמינים'], ['unavailable', 'לא זמינים']] as const).map(([v, label]) => (
            <button key={v} onClick={() => setFilterStatus(v)}
              className={filterStatus === v
                ? 'px-3 py-1 rounded-md text-xs font-bold bg-white text-gray-800 shadow-sm'
                : 'px-3 py-1 rounded-md text-xs font-bold text-gray-500'}>
              {label}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400 mr-auto">{filtered.length} תוצאות</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className={ROW + ' py-3 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wide'}>
          <div/><div className="text-right">מוצר</div><div className="text-right">קטגוריה</div>
          <div className="text-right">מחיר</div><div className="text-center">זמין</div>
          <div className="text-center">מומלץ</div><div className="text-center">פעולות</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <span className="inline-block w-6 h-6 border-2 border-gray-200 border-t-brand-500 rounded-full animate-spin ml-3"/>
            טוען מוצרים...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <Package size={48} strokeWidth={1}/>
            <p className="font-medium">{search || filterCat || filterStatus ? 'לא נמצאו תוצאות' : 'אין מוצרים עדיין'}</p>
            {!search && !filterCat && !filterStatus && (
              <button onClick={openNew} className="btn-primary text-sm mt-1">הוסף מוצר ראשון</button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(p => (
              <div key={p.id} className={ROW + ' py-3 items-center hover:bg-gray-50 transition-colors' + (p.is_available ? '' : ' opacity-50')}>
                <div className="w-11 h-11 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name_he} className="w-full h-full object-cover"/>
                    : <span className="text-xl">🥩</span>}
                </div>
                <div className="min-w-0 text-right">
                  <div className="flex items-center gap-2 justify-end flex-wrap">
                    <p className="font-bold text-gray-800 text-sm truncate">{p.name_he}</p>
                    {p.badge && <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full border border-red-100">{p.badge}</span>}
                  </div>
                  {p.description_he && <p className="text-xs text-gray-400 truncate mt-0.5">{p.description_he}</p>}
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{p.category_name || '—'}</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-brand-600 text-sm">&#8362;{p.price}</span>
                  <span className="text-xs text-gray-400 block">{p.pricing_type === 'per_kg' ? 'לקג' : 'ליח'}</span>
                </div>
                <div className="flex justify-center">
                  <button onClick={() => toggleAvail(p)}
                    className={p.is_available
                      ? 'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700'
                      : 'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-400'}>
                    {p.is_available ? <Eye size={13}/> : <EyeOff size={13}/>}
                    {p.is_available ? 'זמין' : 'מוסתר'}
                  </button>
                </div>
                <div className="flex justify-center">
                  <button onClick={() => toggleFeat(p)}
                    className={p.is_featured ? 'p-2 rounded-full bg-amber-50 text-amber-500' : 'p-2 rounded-full text-gray-300 hover:text-amber-400'}>
                    {p.is_featured ? <Star size={15} fill="currentColor"/> : <StarOff size={15}/>}
                  </button>
                </div>
                <div className="flex items-center gap-1 justify-center">
                  <button onClick={() => openEdit(p)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg">
                    <Edit2 size={13}/> עריכה
                  </button>
                  <button onClick={() => setDelTarget(p)}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 text-right">
            מציג {filtered.length} מתוך {products.length} מוצרים
          </div>
        )}
      </div>

      {modalOpen && (
        <ProductModal editProduct={editTarget} categories={categories}
          onClose={() => { setModalOpen(false); setEditTarget(null) }}
          onSaved={handleSaved}/>
      )}
      {delTarget && (
        <DelDialog product={delTarget} onConfirm={handleDelete} onCancel={() => setDelTarget(null)}/>
      )}
    </div>
  )
}
