import { useEffect, useState, useCallback } from 'react'
import {
  TrendingUp, Package, FileText, Truck,
  Calendar, BarChart3, RefreshCw, Download
} from 'lucide-react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const ANON_KEY    = import.meta.env.VITE_SUPABASE_ANON_KEY as string

function hdrs() {
  return { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, 'Content-Type': 'application/json' }
}
async function rpc<T>(fn: string, body: Record<string,unknown> = {}): Promise<T> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, { method:'POST', headers: hdrs(), body: JSON.stringify(body) })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

const STATUS_HE: Record<string,string> = {
  new:'חדשה', in_preparation:'בהכנה', weighed:'נשקל',
  payment_pending:'ממתין לתשלום', paid:'שולם', delivered:'נמסר', cancelled:'בוטל'
}
const STATUS_COLOR: Record<string,string> = {
  paid:'bg-green-100 text-green-700', delivered:'bg-blue-100 text-blue-700',
  payment_pending:'bg-yellow-100 text-yellow-700', weighed:'bg-purple-100 text-purple-700',
  cancelled:'bg-red-100 text-red-700'
}

function fmt(n: number) { return `₪${n.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` }
function fmtDate(s: string) { return new Date(s).toLocaleDateString('he-IL') }
function fmtDateTime(s: string) { return new Date(s).toLocaleString('he-IL', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' }) }

// Date range picker
function DateRange({ start, end, onApply }: { start:string; end:string; onApply:(s:string,e:string)=>void }) {
  const [s, setS] = useState(start)
  const [e, setE] = useState(end)
  const inp = 'border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300'
  return (
    <div className="flex items-center gap-2 flex-wrap" dir="rtl">
      <span className="text-sm text-gray-500">מ-</span>
      <input type="date" className={inp} value={s} onChange={ev=>setS(ev.target.value)} />
      <span className="text-sm text-gray-500">עד</span>
      <input type="date" className={inp} value={e} onChange={ev=>setE(ev.target.value)} />
      <button onClick={()=>onApply(s,e)} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-sm font-bold rounded-lg hover:bg-brand-700">
        <RefreshCw size={13}/>הצג
      </button>
    </div>
  )
}

// ── Tab: החשבון שלי ─────────────────────────────────────────────────────────
function AccountSummaryTab({ start, end }: { start:string; end:string }) {
  const [data, setData] = useState<Record<string,number>|null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    rpc<Record<string,number>>('report_account_summary', { p_start: start, p_end: end })
      .then(setData).finally(()=>setLoading(false))
  }, [start, end])
  if (loading) return <p className="text-center py-10 text-gray-400">טוען...</p>
  if (!data) return null
  const cards = [
    { label: 'סה"כ הכנסות (כולל ממתין)', value: fmt(data.total_revenue), color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'הכנסות ששולמו בפועל', value: fmt(data.paid_revenue), color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'סה"כ הזמנות', value: String(data.total_orders), color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'הזמנות ששולמו', value: String(data.paid_orders), color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'ממתינות לתשלום', value: String(data.pending_orders), color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'הזמנות שבוטלו', value: String(data.cancelled_orders), color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'ממוצע להזמנה', value: fmt(data.avg_order_value), color: 'text-gray-700', bg: 'bg-gray-50' },
    { label: 'לקוחות שהזמינו', value: String(data.unique_customers), color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'משלוחים', value: String(data.delivery_orders), color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'איסוף עצמי', value: String(data.pickup_orders), color: 'text-teal-600', bg: 'bg-teal-50' },
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4" dir="rtl">
      {cards.map(c => (
        <div key={c.label} className={`${c.bg} rounded-2xl p-4`}>
          <p className="text-xs text-gray-500 font-medium">{c.label}</p>
          <p className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</p>
        </div>
      ))}
    </div>
  )
}

// ── Tab: פדיון יומי ─────────────────────────────────────────────────────────
interface DailyRow { day:string; total_orders:number; paid_orders:number; cancelled_orders:number; revenue:number; paid_revenue:number; avg_order:number }
function DailyRevenueTab({ start, end }: { start:string; end:string }) {
  const [rows, setRows] = useState<DailyRow[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    rpc<DailyRow[]>('report_daily_revenue', { p_start: start, p_end: end })
      .then(setRows).finally(()=>setLoading(false))
  }, [start, end])
  const totalRev = rows.reduce((s,r)=>s+r.revenue,0)
  const totalOrd = rows.reduce((s,r)=>s+r.total_orders,0)
  if (loading) return <p className="text-center py-10 text-gray-400">טוען...</p>
  return (
    <div dir="rtl">
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-green-50 rounded-2xl p-4"><p className="text-xs text-gray-500">סה"כ הכנסות</p><p className="text-xl font-bold text-green-600 mt-1">{fmt(totalRev)}</p></div>
        <div className="bg-brand-50 rounded-2xl p-4"><p className="text-xs text-gray-500">סה"כ הזמנות</p><p className="text-xl font-bold text-brand-600 mt-1">{totalOrd}</p></div>
        <div className="bg-gray-50 rounded-2xl p-4"><p className="text-xs text-gray-500">ממוצע יומי</p><p className="text-xl font-bold text-gray-700 mt-1">{rows.length > 0 ? fmt(totalRev/rows.length) : '—'}</p></div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['תאריך','הזמנות','שולמו','בוטלו','הכנסה','שולם בפועל','ממוצע'].map(h=>(
                <th key={h} className="text-right px-4 py-2.5 font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">אין נתונים לתקופה זו</td></tr>
            ) : rows.map(r=>(
              <tr key={r.day} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium text-gray-700">{fmtDate(r.day)}</td>
                <td className="px-4 py-2.5">{r.total_orders}</td>
                <td className="px-4 py-2.5 text-green-600 font-medium">{r.paid_orders}</td>
                <td className="px-4 py-2.5 text-red-400">{r.cancelled_orders || '—'}</td>
                <td className="px-4 py-2.5 font-bold text-brand-600">{r.revenue > 0 ? fmt(r.revenue) : '—'}</td>
                <td className="px-4 py-2.5 font-bold text-green-600">{r.paid_revenue > 0 ? fmt(r.paid_revenue) : '—'}</td>
                <td className="px-4 py-2.5 text-gray-500">{r.avg_order > 0 ? fmt(r.avg_order) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Tab: פדיון תקופתי ──────────────────────────────────────────────────────
interface PeriodRow { period:string; total_orders:number; paid_orders:number; revenue:number; paid_revenue:number }
function PeriodicRevenueTab({ start, end }: { start:string; end:string }) {
  const [rows, setRows] = useState<PeriodRow[]>([])
  const [group, setGroup] = useState<'day'|'week'|'month'>('week')
  const [loading, setLoading] = useState(true)
  const load = useCallback(() => {
    setLoading(true)
    rpc<PeriodRow[]>('report_periodic_revenue', { p_start: start, p_end: end, p_group: group })
      .then(setRows).finally(()=>setLoading(false))
  }, [start, end, group])
  useEffect(()=>{ load() }, [load])
  const totalRev = rows.reduce((s,r)=>s+r.revenue,0)
  const groupLabel = group === 'day' ? 'יום' : group === 'week' ? 'שבוע' : 'חודש'
  if (loading) return <p className="text-center py-10 text-gray-400">טוען...</p>
  return (
    <div dir="rtl">
      <div className="flex gap-2 mb-4">
        {(['day','week','month'] as const).map(g=>(
          <button key={g} onClick={()=>setGroup(g)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${group===g ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {g==='day'?'יומי':g==='week'?'שבועי':'חודשי'}
          </button>
        ))}
        <span className="mr-auto text-sm text-gray-500 self-center">סה"כ: {fmt(totalRev)}</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {[groupLabel,'הזמנות','שולמו','הכנסה','שולם בפועל'].map(h=>(
                <th key={h} className="text-right px-4 py-2.5 font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">אין נתונים לתקופה זו</td></tr>
            ) : rows.map(r=>(
              <tr key={r.period} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium text-gray-700">{fmtDate(r.period)}</td>
                <td className="px-4 py-2.5">{r.total_orders}</td>
                <td className="px-4 py-2.5 text-green-600">{r.paid_orders}</td>
                <td className="px-4 py-2.5 font-bold text-brand-600">{r.revenue > 0 ? fmt(r.revenue) : '—'}</td>
                <td className="px-4 py-2.5 font-bold text-green-600">{r.paid_revenue > 0 ? fmt(r.paid_revenue) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Tab: היסטוריית חשבוניות ────────────────────────────────────────────────
interface Invoice { id:string; order_number:string; created_at:string; status:string; delivery_type:string; total:number; final_total:number|null; customer_name:string; customer_phone:string; customer_city:string; discount_amount:number; coupon_code:string|null; paid_at:string|null }
function InvoiceHistoryTab({ start, end }: { start:string; end:string }) {
  const [rows, setRows] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    rpc<Invoice[]>('report_invoice_history', { p_start: start, p_end: end })
      .then(setRows).finally(()=>setLoading(false))
  }, [start, end])
  const total = rows.reduce((s,r)=>s+r.total,0)
  if (loading) return <p className="text-center py-10 text-gray-400">טוען...</p>
  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{rows.length} חשבוניות · סה"כ {fmt(total)}</span>
        <button onClick={()=>{
          const csv = ['מספר הזמנה,לקוח,טלפון,עיר,סכום,סטטוס,תאריך',
            ...rows.map(r=>`${r.order_number},${r.customer_name},${r.customer_phone},${r.customer_city||''},${r.total},${STATUS_HE[r.status]||r.status},${fmtDateTime(r.created_at)}`)
          ].join('\n')
          const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,﻿'+csv; a.download='invoices.csv'; a.click()
        }} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          <Download size={13}/>ייצא CSV
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['#הזמנה','לקוח','עיר','סכום','הנחה','סטטוס','תאריך'].map(h=>(
                <th key={h} className="text-right px-3 py-2.5 font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">אין חשבוניות לתקופה זו</td></tr>
            ) : rows.map(r=>(
              <tr key={r.id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2.5 font-mono font-bold text-gray-700">#{r.order_number}</td>
                <td className="px-3 py-2.5"><p className="font-medium text-gray-800">{r.customer_name}</p><p className="text-xs text-gray-400">{r.customer_phone}</p></td>
                <td className="px-3 py-2.5 text-gray-500">{r.customer_city||'—'}</td>
                <td className="px-3 py-2.5 font-bold text-brand-600">{fmt(r.total)}</td>
                <td className="px-3 py-2.5 text-gray-500">{r.discount_amount > 0 ? fmt(r.discount_amount) : '—'}{r.coupon_code ? ` (${r.coupon_code})` : ''}</td>
                <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLOR[r.status]||'bg-gray-100 text-gray-600'}`}>{STATUS_HE[r.status]||r.status}</span></td>
                <td className="px-3 py-2.5 text-gray-500 text-xs">{fmtDateTime(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Tab: תעודות משלוח ──────────────────────────────────────────────────────
interface DeliveryCert { id:string; order_number:string; created_at:string; status:string; delivery_address:string|null; delivery_city:string|null; preferred_delivery_time:string|null; total:number; customer_name:string; customer_phone:string; delivered_at:string|null }
function DeliveryCertTab({ start, end }: { start:string; end:string }) {
  const [rows, setRows] = useState<DeliveryCert[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    rpc<DeliveryCert[]>('report_delivery_certificates', { p_start: start, p_end: end })
      .then(setRows).finally(()=>setLoading(false))
  }, [start, end])
  if (loading) return <p className="text-center py-10 text-gray-400">טוען...</p>
  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{rows.length} משלוחים</span>
        <button onClick={()=>{
          const csv = ['מספר הזמנה,לקוח,טלפון,כתובת,עיר,סכום,סטטוס,נמסר בתאריך',
            ...rows.map(r=>`${r.order_number},${r.customer_name},${r.customer_phone},${r.delivery_address||''},${r.delivery_city||''},${r.total},${STATUS_HE[r.status]||r.status},${r.delivered_at?fmtDateTime(r.delivered_at):''}`)
          ].join('\n')
          const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,﻿'+csv; a.download='deliveries.csv'; a.click()
        }} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          <Download size={13}/>ייצא CSV
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['#הזמנה','לקוח','כתובת','זמן מועדף','סכום','סטטוס','תאריך הזמנה'].map(h=>(
                <th key={h} className="text-right px-3 py-2.5 font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">אין משלוחים לתקופה זו</td></tr>
            ) : rows.map(r=>(
              <tr key={r.id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2.5 font-mono font-bold text-gray-700">#{r.order_number}</td>
                <td className="px-3 py-2.5"><p className="font-medium text-gray-800">{r.customer_name}</p><p className="text-xs text-gray-400">{r.customer_phone}</p></td>
                <td className="px-3 py-2.5 text-gray-600">{[r.delivery_address, r.delivery_city].filter(Boolean).join(', ') || '—'}</td>
                <td className="px-3 py-2.5 text-gray-500 text-xs">{r.preferred_delivery_time||'—'}</td>
                <td className="px-3 py-2.5 font-bold text-brand-600">{fmt(r.total)}</td>
                <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLOR[r.status]||'bg-gray-100 text-gray-600'}`}>{STATUS_HE[r.status]||r.status}</span></td>
                <td className="px-3 py-2.5 text-gray-500 text-xs">{fmtDateTime(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'summary',    label: 'החשבון שלי',           icon: BarChart3 },
  { id: 'daily',      label: 'פדיון יומי',            icon: TrendingUp },
  { id: 'periodic',   label: 'פדיון תקופתי',          icon: Calendar },
  { id: 'invoices',   label: 'היסטוריית חשבוניות',   icon: FileText },
  { id: 'deliveries', label: 'תעודות משלוח',          icon: Truck },
  { id: 'products',   label: 'מוצרים מובילים',        icon: Package },
]

interface BestSeller { product_name:string; order_count:number; total_revenue:number }

export default function ReportsPage() {
  const today = new Date().toISOString().slice(0,10)
  const monthAgo = new Date(Date.now() - 30*86400000).toISOString().slice(0,10)
  const [tab, setTab] = useState('summary')
  const [start, setStart] = useState(monthAgo)
  const [end, setEnd] = useState(today)
  const [applied, setApplied] = useState({ start: monthAgo, end: today })

  return (
    <div className="space-y-5" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">דוחות קופה</h1>
        <p className="text-sm text-gray-500 mt-1">ניתוח הכנסות, חשבוניות ומשלוחים</p>
      </div>

      {/* Date Range */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <DateRange start={start} end={end} onApply={(s,e)=>{ setStart(s); setEnd(e); setApplied({start:s,end:e}) }} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 flex-nowrap">
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              tab===t.id ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
            }`}>
            <t.icon size={14}/>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        {tab === 'summary'    && <AccountSummaryTab   start={applied.start} end={applied.end} />}
        {tab === 'daily'      && <DailyRevenueTab     start={applied.start} end={applied.end} />}
        {tab === 'periodic'   && <PeriodicRevenueTab  start={applied.start} end={applied.end} />}
        {tab === 'invoices'   && <InvoiceHistoryTab   start={applied.start} end={applied.end} />}
        {tab === 'deliveries' && <DeliveryCertTab     start={applied.start} end={applied.end} />}
        {tab === 'products'   && <BestSellersTab />}
      </div>
    </div>
  )
}

// ── Best Sellers (standalone, no date filter needed) ───────────────────────
function BestSellersTab() {
  const [rows, setRows] = useState<BestSeller[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(()=>{
    rpc<BestSeller[]>('admin_get_best_sellers').then(setRows).catch(()=>setRows([])).finally(()=>setLoading(false))
  },[])
  if (loading) return <p className="text-center py-10 text-gray-400">טוען...</p>
  if (rows.length === 0) return <p className="text-center py-10 text-gray-400">אין נתונים על מוצרים</p>
  return (
    <div dir="rtl" className="space-y-2">
      {rows.slice(0,20).map((r,i)=>(
        <div key={r.product_name} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50">
          <span className="w-7 h-7 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i+1}</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 text-sm truncate">{r.product_name}</p>
            <p className="text-xs text-gray-400">{r.order_count} הזמנות</p>
          </div>
          <p className="font-bold text-brand-600">{fmt(r.total_revenue)}</p>
        </div>
      ))}
    </div>
  )
}
