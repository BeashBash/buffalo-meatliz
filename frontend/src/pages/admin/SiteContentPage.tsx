import { useState, useEffect } from 'react'
import { fetchSiteContent, bulkUpdateSiteContent } from '../../lib/supabase'
import type { SiteContentRow } from '../../lib/supabase'
import { Globe, Image, Type, Save, RefreshCw, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'

type ContentMap = Record<string, SiteContentRow>

const SECTIONS = [
  { id: 'hero',         label: 'הירו – סליידר ראשי',  icon: '🎯' },
  { id: 'about',        label: 'אודות הקצביה',          icon: '📖' },
  { id: 'why',          label: 'למה לבחור בנו',         icon: '⭐' },
  { id: 'delivery',     label: 'משלוחים',                icon: '🚚' },
  { id: 'testimonials', label: 'המלצות לקוחות',          icon: '💬' },
  { id: 'news',         label: 'חדשות ומבצעים',          icon: '📰' },
  { id: 'gallery',      label: 'גלריה',                  icon: '🖼️' },
  { id: 'contact',      label: 'יצירת קשר ופוטר',       icon: '📞' },
]

const C = {
  bg1: '#0f0e0e', bg2: '#1a1919', bg3: '#222121',
  border: '#2e2d2d', accent: '#a8501e', accentH: '#c0601f',
  text: '#d1d0d0', muted: '#6b6a6a',
}

export default function SiteContentPage() {
  const [content, setContent]         = useState<ContentMap>({})
  const [changes, setChanges]         = useState<Record<string, string>>({})
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [error, setError]             = useState('')
  const [activeSection, setActiveSection] = useState('hero')
  const [previewKey, setPreviewKey]   = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true); setError('')
    try {
      const rows = await fetchSiteContent()
      const map: ContentMap = {}
      rows.forEach(r => { map[r.key] = r })
      setContent(map)
    } catch (e: any) {
      setError('שגיאה בחיבור ל-Supabase: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const getValue = (key: string) => key in changes ? changes[key] : (content[key]?.value ?? '')
  const handleChange = (key: string, val: string) => setChanges(p => ({ ...p, [key]: val }))

  async function handleSave() {
    if (!Object.keys(changes).length) return
    setSaving(true); setError('')
    try {
      await bulkUpdateSiteContent(changes)
      setContent(prev => {
        const next = { ...prev }
        Object.entries(changes).forEach(([k, v]) => { if (next[k]) next[k] = { ...next[k], value: v } })
        return next
      })
      setChanges({})
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      setError('שגיאה בשמירה: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const sectionItems = Object.values(content)
    .filter(r => r.section === activeSection)
    .sort((a, b) => a.key.localeCompare(b.key))

  const pendingCount = Object.keys(changes).length

  /* ── Loading ── */
  if (loading) return (
    <div style={{ background: C.bg1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: C.muted, fontSize: 14 }}>מתחבר ל-Supabase...</div>
    </div>
  )

  return (
    <div style={{ background: C.bg1, minHeight: '100vh', direction: 'rtl' }}>

      {/* ── Sticky header ── */}
      <div style={{ background: C.bg2, borderBottom: `1px solid ${C.border}`, padding: '16px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Globe size={20} style={{ color: C.accent }} />
            <div>
              <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 800, margin: 0 }}>ניהול תוכן האתר</h1>
              <p style={{ color: C.muted, fontSize: 12, margin: '2px 0 0' }}>שינויים נשמרים ישירות ל-Supabase — בלי בקאנד</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {error && (
              <span style={{ color: '#ef4444', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
                <AlertCircle size={14} />{error}
              </span>
            )}
            {saved && (
              <span style={{ color: '#22c55e', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
                <CheckCircle size={14} />נשמר!
              </span>
            )}
            <button onClick={load}
              style={{ padding: '8px 14px', background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 4, color: C.muted, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={13} />רענן
            </button>
            <button onClick={handleSave} disabled={pendingCount === 0 || saving}
              style={{ padding: '8px 22px', background: pendingCount > 0 ? C.accent : '#333', border: 'none', borderRadius: 4, color: pendingCount > 0 ? '#fff' : C.muted, fontSize: 13, fontWeight: 700, cursor: pendingCount > 0 ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Save size={14} />
              {saving ? 'שומר...' : pendingCount > 0 ? `שמור (${pendingCount} שינויים)` : 'שמור שינויים'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Body: sidebar + editor ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: 'calc(100vh - 73px)' }}>

        {/* Sidebar */}
        <nav style={{ background: C.bg2, borderLeft: `1px solid ${C.border}`, paddingTop: 12 }}>
          {SECTIONS.map(sec => {
            const secChanges = Object.keys(changes).filter(k => content[k]?.section === sec.id).length
            const active = activeSection === sec.id
            return (
              <button key={sec.id} onClick={() => setActiveSection(sec.id)}
                style={{ width: '100%', padding: '12px 18px', textAlign: 'right', background: active ? `${C.accent}20` : 'transparent', border: 'none', borderRight: `3px solid ${active ? C.accent : 'transparent'}`, color: active ? '#fff' : C.muted, fontSize: 13, fontWeight: active ? 700 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{sec.icon}</span>
                <span style={{ flex: 1 }}>{sec.label}</span>
                {secChanges > 0 && (
                  <span style={{ background: C.accent, color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 9999, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {secChanges}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Editor */}
        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 700, margin: 0 }}>
              {SECTIONS.find(s => s.id === activeSection)?.icon}{' '}
              {SECTIONS.find(s => s.id === activeSection)?.label}
            </h2>
            <p style={{ color: C.muted, fontSize: 12, margin: '4px 0 0' }}>{sectionItems.length} שדות</p>
          </div>

          {sectionItems.length === 0 ? (
            <p style={{ color: C.muted, textAlign: 'center', paddingTop: 60 }}>אין תוכן לסעיף זה</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {sectionItems.map(item => {
                const val     = getValue(item.key)
                const changed = item.key in changes
                const isImg   = item.type === 'image'
                const isLong  = item.label.includes('תיאור') || item.label.includes('אודות')
                const isPrev  = previewKey === item.key

                return (
                  <div key={item.key}
                    style={{ background: C.bg2, border: `1px solid ${changed ? C.accent : C.border}`, borderRadius: 6, padding: 16, transition: 'border-color .2s' }}>

                    {/* Label row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {isImg ? <Image size={14} style={{ color: C.accent }} /> : <Type size={14} style={{ color: C.muted }} />}
                        <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{item.label}</span>
                        {changed && <span style={{ background: `${C.accent}33`, color: C.accent, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 3 }}>שונה</span>}
                      </div>
                      {isImg && (
                        <button onClick={() => setPreviewKey(isPrev ? null : item.key)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                          {isPrev ? <EyeOff size={13} /> : <Eye size={13} />}
                          {isPrev ? 'הסתר' : 'תצוגה מקדימה'}
                        </button>
                      )}
                    </div>

                    {/* Input */}
                    {isImg ? (
                      <>
                        <input type="text" value={val} onChange={e => handleChange(item.key, e.target.value)}
                          placeholder="הדבק URL של תמונה..."
                          style={{ width: '100%', padding: '10px 12px', background: C.bg3, border: `1px solid ${changed ? C.accent : C.border}`, borderRadius: 4, color: C.text, fontSize: 13, outline: 'none', direction: 'ltr', textAlign: 'left', boxSizing: 'border-box' }} />
                        {isPrev && val && (
                          <div style={{ marginTop: 10, borderRadius: 4, overflow: 'hidden', border: `1px solid ${C.border}` }}>
                            <img src={val} alt={item.label} style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }}
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                          </div>
                        )}
                      </>
                    ) : isLong ? (
                      <textarea value={val} onChange={e => handleChange(item.key, e.target.value)} rows={3}
                        style={{ width: '100%', padding: '10px 12px', background: C.bg3, border: `1px solid ${changed ? C.accent : C.border}`, borderRadius: 4, color: C.text, fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.6 }} />
                    ) : (
                      <input type="text" value={val} onChange={e => handleChange(item.key, e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', background: C.bg3, border: `1px solid ${changed ? C.accent : C.border}`, borderRadius: 4, color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
