import { useEffect, useState } from 'react'
import {
  MessageCircle, Send, Clock, Search, CheckCircle
} from 'lucide-react'
import {
  adminGetCustomers, adminGetMessages, adminLogMessage,
  AdminCustomer, MessageLog
} from '../../lib/supabase'

const TEMPLATES = [
  { title: 'הזמנה מוכנה', text: 'שלום {שם}, ההזמנה שלך מוכנה לאיסוף! נשמח לראותך. - באפלו מיטליז' },
  { title: 'אחרי שקילה', text: 'שלום {שם}, ההזמנה שלך נשקלה. הסכום הסופי הוא ₪{סכום}. קישור לתשלום: {קישור}' },
  { title: 'תזכורת תשלום', text: 'שלום {שם}, תזכורת ידידותית — ההזמנה שלך ממתינה לתשלום. לחץ כאן לתשלום: {קישור}' },
  { title: 'מבצע מיוחד', text: 'שלום {שם}! יש לנו מבצע מיוחד השבוע: {פרטי המבצע}. כמות מוגבלת! - באפלו מיטליז' },
  { title: 'תודה על קנייה', text: 'שלום {שם}, תודה על הקנייה! שמחים שבחרת בנו. נתראה בפעם הבאה 🥩' },
  { title: 'עדכון משלוח', text: 'שלום {שם}, ההזמנה שלך בדרך אליך! המשלוח יגיע בקרוב. תודה על הסבלנות.' },
]

function formatPhone(p: string) {
  return p.replace(/\D/g, '').replace(/^972/, '0')
}

function waLink(phone: string, msg: string) {
  const num = formatPhone(phone).replace(/^0/, '972')
  return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `לפני ${m} דק'`
  const h = Math.floor(m / 60)
  if (h < 24) return `לפני ${h} שע'`
  return new Date(dateStr).toLocaleDateString('he-IL')
}

// ── Tab: Broadcast ─────────────────────────────────────────────────────────
function BroadcastTab({ customers }: { customers: AdminCustomer[] }) {
  const [template, setTemplate] = useState(TEMPLATES[0].text)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [customMsg, setCustomMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [sentCount, setSentCount] = useState(0)

  const msg = customMsg || template

  const filtered = customers.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(c => c.id)))
  }

  function toggle(id: string) {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  async function sendAll() {
    const targets = customers.filter(c => selected.has(c.id))
    if (!targets.length || !msg.trim()) return
    setSending(true)
    let count = 0
    for (const c of targets) {
      const personal = msg.replace('{שם}', c.full_name)
      window.open(waLink(c.phone, personal), '_blank')
      await adminLogMessage(c.id, c.phone, personal, 'whatsapp').catch(() => {})
      count++
      await new Promise(r => setTimeout(r, 800))
    }
    setSentCount(count)
    setSending(false)
    setSelected(new Set())
  }

  return (
    <div className="grid grid-cols-[1fr_380px] gap-6">
      {/* Left: customer selector */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute right-3 top-2.5 text-gray-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="חפש לקוח..."
              className="w-full border border-gray-200 rounded-xl pr-9 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"/>
          </div>
          <button onClick={toggleAll}
            className="text-sm text-green-600 font-semibold hover:underline whitespace-nowrap">
            {selected.size === filtered.length ? 'בטל הכל' : 'בחר הכל'}
          </button>
        </div>

        <div className="space-y-1 max-h-[480px] overflow-y-auto">
          {filtered.map(c => (
            <label key={c.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 bg-white cursor-pointer">
              <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)}
                className="w-4 h-4 rounded accent-green-500"/>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{c.full_name}</p>
                <p className="text-xs text-gray-500">{c.phone}</p>
              </div>
              <span className="text-xs text-gray-400">{c.order_count} הזמ'</span>
            </label>
          ))}
        </div>
      </div>

      {/* Right: composer */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h3 className="font-bold text-gray-700">תבניות מהירות</h3>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map((t, i) => (
              <button key={i} onClick={() => { setTemplate(t.text); setCustomMsg('') }}
                className={`text-xs rounded-lg px-3 py-2 text-right border transition-colors ${
                  template === t.text && !customMsg
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                }`}>
                {t.title}
              </button>
            ))}
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">הודעה מותאמת אישית</p>
            <textarea rows={5} value={customMsg} onChange={e => setCustomMsg(e.target.value)}
              placeholder="כתוב הודעה... (השתמש ב-{שם} לשם הלקוח)"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-300"/>
          </div>

          <div className="bg-green-50 rounded-xl p-3 text-sm text-gray-700 border border-green-100">
            <p className="text-xs font-bold text-green-700 mb-1">תצוגה מקדימה</p>
            <p className="whitespace-pre-wrap">{msg.replace('{שם}', 'שם הלקוח')}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 text-sm text-gray-500">
              {selected.size} לקוחות נבחרו
            </div>
            <button onClick={sendAll} disabled={selected.size === 0 || sending || !msg.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white text-sm font-bold rounded-xl hover:bg-green-600 disabled:opacity-40">
              <Send size={15}/>
              {sending ? 'שולח...' : 'שלח WhatsApp'}
            </button>
          </div>

          {sentCount > 0 && (
            <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
              <CheckCircle size={16}/> נשלחו {sentCount} הודעות
            </div>
          )}

          <p className="text-xs text-gray-400">
            ⚠️ לכל לקוח ייפתח חלון WhatsApp נפרד לאישור הידני. הדפדפן עלול לחסום חלונות קופצים.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Tab: History ───────────────────────────────────────────────────────────
function HistoryTab() {
  const [msgs, setMsgs] = useState<MessageLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminGetMessages().then(setMsgs).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-center py-12 text-gray-400">טוען היסטוריה...</p>

  if (msgs.length === 0) return (
    <div className="text-center py-16 text-gray-400">
      <MessageCircle size={40} className="mx-auto mb-3 opacity-30"/>
      <p>עדיין לא נשלחו הודעות</p>
    </div>
  )

  return (
    <div className="space-y-2">
      {msgs.map(m => (
        <div key={m.id} className="flex items-start gap-4 bg-white rounded-xl border border-gray-100 p-4">
          <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center shrink-0">
            <MessageCircle size={16} className="text-green-600"/>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-gray-800 text-sm">
                {m.customer_name ?? 'לקוח'} — {m.phone}
              </p>
              <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                <Clock size={11}/>{timeAgo(m.created_at)}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap line-clamp-2">{m.message}</p>
            <span className="mt-1 inline-block text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
              {m.channel}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function MessagesPage() {
  const [tab, setTab] = useState<'broadcast' | 'history'>('broadcast')
  const [customers, setCustomers] = useState<AdminCustomer[]>([])

  useEffect(() => {
    adminGetCustomers().then(setCustomers).catch(() => {})
  }, [])

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">הודעות ו-WhatsApp</h1>
        <p className="text-sm text-gray-500 mt-1">שלח הודעות ישירות ללקוחות דרך WhatsApp</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {([
          ['broadcast', 'שלח הודעה', Send],
          ['history',   'היסטוריה', Clock],
        ] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key as typeof tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <Icon size={15}/>{label}
          </button>
        ))}
      </div>

      {tab === 'broadcast' ? (
        <BroadcastTab customers={customers}/>
      ) : (
        <HistoryTab/>
      )}
    </div>
  )
}
