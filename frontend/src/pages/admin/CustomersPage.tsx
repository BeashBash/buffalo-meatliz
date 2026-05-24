import { useEffect, useState } from 'react'
import {
  Users, Search, Phone, Mail, MapPin,
  MessageCircle, ChevronDown, ChevronUp, X, Pencil, Check
} from 'lucide-react'
import {
  adminGetCustomers, adminGetCustomerOrders, adminLogMessage, adminUpdateCustomer,
  AdminCustomer, CustomerOrder, UpdateCustomerPayload
} from '../../lib/supabase'

const STATUS_HE: Record<string, string> = {
  new: 'חדשה', in_preparation: 'בהכנה', weighed: 'נשקל',
  payment_pending: 'ממתין לתשלום', paid: 'שולם',
  delivered: 'נמסר', cancelled: 'בוטל',
}

const DAYS_HE = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת','כל שבועיים','לא להתקשר']

function waLink(phone: string, msg: string) {
  const num = phone.replace(/\D/g,'').replace(/^0/,'972')
  return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`
}

// ── WhatsApp Modal ─────────────────────────────────────────────────────────
function MsgModal({ c, onClose }: { c: AdminCustomer; onClose: () => void }) {
  const [msg, setMsg] = useState('')
  const [sent, setSent] = useState(false)
  const TEMPLATES = [
    `שלום ${c.full_name}, הזמנתך מוכנה ומחכה לאיסוף!`,
    `שלום ${c.full_name}, ההזמנה שלך נשקלה. הסכום הסופי: `,
    `שלום ${c.full_name}, תזכורת - ההזמנה שלך ממתינה לתשלום.`,
    `שלום ${c.full_name}, תודה על הקנייה! נשמח לראותך שוב 🥩`,
  ]
  async function send() {
    if (!msg.trim()) return
    window.open(waLink(c.phone, msg), '_blank')
    await adminLogMessage(c.id, c.phone, msg, 'whatsapp').catch(() => {})
    setSent(true)
    setTimeout(onClose, 1200)
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <div><h3 className="font-bold text-gray-800">WhatsApp</h3><p className="text-sm text-gray-500">{c.full_name} — {c.phone}</p></div>
          <button onClick={onClose}><X size={20} className="text-gray-400"/></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t,i) => <button key={i} onClick={() => setMsg(t)} className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg px-3 py-1.5 hover:bg-green-100">תבנית {i+1}</button>)}
          </div>
          <textarea rows={4} value={msg} onChange={e => setMsg(e.target.value)} placeholder="כתוב הודעה..." className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-300"/>
          {sent ? <p className="text-center text-green-600 font-bold">נשלח!</p> : (
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">ביטול</button>
              <button onClick={send} disabled={!msg.trim()} className="flex-1 py-2.5 bg-green-500 text-white text-sm font-bold rounded-xl hover:bg-green-600 disabled:opacity-40 flex items-center justify-center gap-2">
                <MessageCircle size={15}/>פתח WhatsApp
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Edit Modal ─────────────────────────────────────────────────────────────
function EditModal({ c, onSave, onClose }: { c: AdminCustomer; onSave: (p: UpdateCustomerPayload) => Promise<void>; onClose: () => void }) {
  const [f, setF] = useState<UpdateCustomerPayload>({
    full_name: c.full_name, phone: c.phone, phone2: c.phone2 ?? '',
    email: c.email ?? '', city: c.city ?? '', address: c.address ?? '',
    apartment: c.apartment ?? '', floor: c.floor ?? '',
    entry_code: c.entry_code ?? '', address_notes: c.address_notes ?? '',
    preferred_contact_day: c.preferred_contact_day ?? '',
    internal_notes: c.internal_notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  function set(k: keyof UpdateCustomerPayload, v: string) { setF(prev => ({...prev, [k]: v})) }
  async function save() { setSaving(true); await onSave(f); setSaving(false) }

  const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold text-gray-800 text-lg">עריכת לקוח</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400"/></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Name + phones */}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">שם מלא</label><input className={inp} value={f.full_name} onChange={e=>set('full_name',e.target.value)}/></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">אימייל</label><input className={inp} value={f.email??''} onChange={e=>set('email',e.target.value)}/></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">טלפון סלולרי</label><input className={inp} value={f.phone} onChange={e=>set('phone',e.target.value)}/></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">טלפון נוסף</label><input className={inp} value={f.phone2??''} onChange={e=>set('phone2',e.target.value)} placeholder="אופציונלי"/></div>
          </div>
          {/* Address */}
          <div className="border-t pt-4">
            <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">כתובת</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">עיר</label><input className={inp} value={f.city??''} onChange={e=>set('city',e.target.value)}/></div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">רחוב + מספר</label><input className={inp} value={f.address??''} onChange={e=>set('address',e.target.value)}/></div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">דירה</label><input className={inp} value={f.apartment??''} onChange={e=>set('apartment',e.target.value)} placeholder="מס' דירה"/></div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">קומה</label><input className={inp} value={f.floor??''} onChange={e=>set('floor',e.target.value)}/></div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">קוד כניסה</label><input className={inp} value={f.entry_code??''} onChange={e=>set('entry_code',e.target.value)}/></div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">הערות לכתובת</label><input className={inp} value={f.address_notes??''} onChange={e=>set('address_notes',e.target.value)}/></div>
            </div>
          </div>
          {/* Preferences */}
          <div className="border-t pt-4">
            <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">העדפות</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">יום מועדף ליצירת קשר</label>
                <select className={inp} value={f.preferred_contact_day??''} onChange={e=>set('preferred_contact_day',e.target.value)}>
                  <option value="">בחר</option>
                  {DAYS_HE.map(d=><option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">הערות פנימיות</label>
                <textarea rows={2} className={inp + ' resize-none'} value={f.internal_notes??''} onChange={e=>set('internal_notes',e.target.value)}/>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">ביטול</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 disabled:opacity-40 flex items-center justify-center gap-2">
            <Check size={15}/>{saving ? 'שומר...' : 'שמור'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Customer Row ───────────────────────────────────────────────────────────
function CustomerRow({ c, onMsg, onEdit }: { c: AdminCustomer; onMsg: ()=>void; onEdit: ()=>void }) {
  const [open, setOpen] = useState(false)
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  async function toggle() {
    if (!open && orders.length === 0) {
      setLoadingOrders(true)
      adminGetCustomerOrders(c.id).then(setOrders).catch(()=>{}).finally(()=>setLoadingOrders(false))
    }
    setOpen(o=>!o)
  }

  const fullAddr = [c.address, c.apartment ? `דירה ${c.apartment}` : null, c.floor ? `קומה ${c.floor}` : null].filter(Boolean).join(', ')

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors">
      <div className="grid grid-cols-[1fr_130px_80px_80px_160px] items-center gap-3 px-4 py-3 bg-white">
        {/* Name */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-sm shrink-0">
            {c.full_name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 text-sm truncate">{c.full_name}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1"><Phone size={11}/>{c.phone}{c.phone2 ? ` | ${c.phone2}` : ''}</p>
            {c.email && <p className="text-xs text-gray-400 flex items-center gap-1"><Mail size={11}/>{c.email}</p>}
            {(c.city || fullAddr) && <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={11}/>{c.city}{fullAddr ? ` — ${fullAddr}` : ''}</p>}
            {c.entry_code && <p className="text-xs text-gray-400">קוד כניסה: {c.entry_code}</p>}
            {c.internal_notes && <p className="text-xs text-amber-600 mt-0.5">📝 {c.internal_notes}</p>}
          </div>
        </div>
        {/* last order */}
        <div className="text-xs text-gray-600">
          {c.last_order_at ? (
            <>
              <span>{new Date(c.last_order_at).toLocaleDateString('he-IL')}</span>
              {c.last_order_total != null && (
                <span className="block font-bold text-gray-800">₪{c.last_order_total.toFixed(0)}</span>
              )}
            </>
          ) : <span className="text-gray-400">—</span>}
        </div>
        {/* orders */}
        <div className="text-sm font-medium text-gray-700">{c.order_count}</div>
        {/* spent */}
        <div className="text-sm font-bold text-gray-800">₪{c.total_spent.toFixed(0)}</div>
        {/* actions */}
        <div className="flex items-center gap-1.5 justify-end">
          <button onClick={onEdit} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-brand-50 hover:text-brand-600"><Pencil size={13}/></button>
          <button onClick={onMsg} className="flex items-center gap-1 px-2.5 py-1.5 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600"><MessageCircle size={12}/>WA</button>
          <button onClick={toggle} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">{open?<ChevronUp size={14}/>:<ChevronDown size={14}/>}</button>
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
          <p className="text-xs font-semibold text-gray-500 mb-2">היסטוריית הזמנות</p>
          {loadingOrders ? <p className="text-sm text-gray-400">טוען...</p>
          : orders.length === 0 ? <p className="text-sm text-gray-400">אין הזמנות</p>
          : <div className="space-y-1">
            {orders.map(o=>(
              <div key={o.id} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-2 border border-gray-100">
                <span className="font-mono font-bold text-gray-700">#{o.order_number}</span>
                <span className="text-gray-500">{new Date(o.created_at).toLocaleDateString('he-IL')}</span>
                <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 font-bold">{STATUS_HE[o.status]??o.status}</span>
                <span className="font-bold text-gray-800">₪{(o.final_total??o.estimated_total).toFixed(0)}</span>
              </div>
            ))}
          </div>}
        </div>
      )}
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function CustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [msgTarget, setMsgTarget] = useState<AdminCustomer|null>(null)
  const [editTarget, setEditTarget] = useState<AdminCustomer|null>(null)

  useEffect(()=>{
    adminGetCustomers().then(setCustomers).catch(()=>{}).finally(()=>setLoading(false))
  },[])

  const filtered = customers.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    (c.email??'').toLowerCase().includes(search.toLowerCase()) ||
    (c.city??'').includes(search) ||
    (c.address??'').includes(search)
  )

  async function handleEdit(payload: UpdateCustomerPayload) {
    if (!editTarget) return
    await adminUpdateCustomer(editTarget.id, payload)
    setCustomers(prev => prev.map(c => c.id === editTarget.id ? {...c, ...payload} : c))
    setEditTarget(null)
  }

  const totalSpent = customers.reduce((s,c)=>s+c.total_spent,0)
  const totalOrders = customers.reduce((s,c)=>s+c.order_count,0)

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">לקוחות</h1>
          <p className="text-sm text-gray-500 mt-1">{customers.length} לקוחות רשומים</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          {label:'סה"כ לקוחות', value:customers.length, color:'text-blue-600', bg:'bg-blue-50'},
          {label:'סה"כ הזמנות', value:totalOrders, color:'text-brand-600', bg:'bg-brand-50'},
          {label:'סה"כ הכנסות', value:`₪${totalSpent.toFixed(0)}`, color:'text-green-600', bg:'bg-green-50'},
        ].map(s=>(
          <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
            <p className="text-xs font-semibold text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search size={16} className="absolute right-3 top-3 text-gray-400"/>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="חפש לקוח לפי שם, טלפון, אימייל, עיר, כתובת..."
          className="w-full border border-gray-200 rounded-xl pr-9 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"/>
      </div>

      <div className="grid grid-cols-[1fr_130px_80px_80px_160px] gap-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        <span>לקוח</span><span>הזמנה אחרונה</span><span>הזמנות</span><span>סה"כ</span><span></span>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400"><Users size={40} className="mx-auto mb-3 opacity-30"/><p>טוען...</p></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><Users size={40} className="mx-auto mb-3 opacity-30"/><p>{search?'לא נמצאו':'אין לקוחות'}</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c=>(
            <CustomerRow key={c.id} c={c} onMsg={()=>setMsgTarget(c)} onEdit={()=>setEditTarget(c)}/>
          ))}
        </div>
      )}

      {msgTarget && <MsgModal c={msgTarget} onClose={()=>setMsgTarget(null)}/>}
      {editTarget && <EditModal c={editTarget} onSave={handleEdit} onClose={()=>setEditTarget(null)}/>}
    </div>
  )
}
