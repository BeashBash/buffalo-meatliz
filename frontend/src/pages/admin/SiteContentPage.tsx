import { useState, useEffect, useRef } from 'react'
import { adminApi } from '../../lib/api'
import {
  Globe, Image, Type, Save, RefreshCw, CheckCircle, AlertCircle,
  ChevronDown, ChevronUp, Eye, EyeOff, Upload
} from 'lucide-react'

interface ContentItem {
  key: string
  value: string | null
  type: string
  section: string
  label: string
}

type ContentMap = Record<string, ContentItem>

const SECTIONS: { id: string; label: string; icon: string }[] = [
  { id: 'hero',         label: 'הירו - סליידר ראשי', icon: '🎯' },
  { id: 'about',        label: 'אודות הקצביה',        icon: '📖' },
  { id: 'why',          label: 'למה לבחור בנו',       icon: '⭐' },
  { id: 'delivery',     label: 'משלוחים',              icon: '🚚' },
  { id: 'testimonials', label: 'המלצות לקוחות',        icon: '💬' },
  { id: 'news',         label: 'חדשות ומבצעים',        icon: '📰' },
  { id: 'gallery',      label: 'גלריה',                icon: '🖼️' },
  { id: 'contact',      label: 'יצירת קשר ופוטר',     icon: '📞' },
]

const C = {
  bg1: '#0f0e0e',
  bg2: '#1a1919',
  bg3: '#222121',
  border: '#2e2d2d',
  accent: '#a8501e',
  accentH: '#c0601f',
  text: '#d1d0d0',
  muted: '#6b6a6a',
}

export default function SiteContentPage() {
  const [content, setContent] = useState<ContentMap>({})
  const [changes, setChanges] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [activeSection, setActiveSection] = useState('hero')
  const [previewKey, setPreviewKey] = useState<string | null>(null)

  useEffect(() => {
    loadContent()
  }, [])

  async function loadContent() {
    setLoading(true)
    setError('')
    try {
      const res = await adminApi.getSiteContent()
      const map: ContentMap = {}
      for (const item of res.data as ContentItem[]) {
        map[item.key] = item
      }
      setContent(map)
    } catch (e: any) {
      setError('שגיאה בטעינת תוכן האתר')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(key: string, value: string) {
    setChanges(prev => ({ ...prev, [key]: value }))
  }

  function getValue(key: string): string {
    if (key in changes) return changes[key]
    return content[key]?.value ?? ''
  }

  async function handleSave() {
    if (Object.keys(changes).length === 0) return
    setSaving(true)
    setError('')
    try {
      await adminApi.updateSiteContent(changes)
      // Merge changes into content
      setContent(prev => {
        const next = { ...prev }
        for (const [key, value] of Object.entries(changes)) {
          if (next[key]) next[key] = { ...next[key], value }
        }
        return next
      })
      setChanges({})
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      setError('שגיאה בשמירה: ' + (e.response?.data?.detail || e.message))
    } finally {
      setSaving(false)
    }
  }

  const sectionItems = Object.values(content).filter(
    item => item.section === activeSection
  )

  const pendingCount = Object.keys(changes).length

  if (loading) {
    return (
      <div style={{ backgroundColor: C.bg1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: C.muted, fontSize: '14px' }}>טוען תוכן...</div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: C.bg1, minHeight: '100vh', direction: 'rtl', fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ backgroundColor: C.bg2, borderBottom: `1px solid ${C.border}`, padding: '20px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Globe size={20} style={{ color: C.accent }} />
            <div>
              <h1 style={{ color: 'white', fontSize: '18px', fontWeight: 800, margin: 0 }}>ניהול תוכן האתר</h1>
              <p style={{ color: C.muted, fontSize: '12px', margin: '2px 0 0' }}>ערוך תמונות וטקסטים של הסטורפרונט</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '13px' }}>
                <AlertCircle size={14} />
                {error}
              </div>
            )}
            {saved && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#22c55e', fontSize: '13px' }}>
                <CheckCircle size={14} />
                נשמר בהצלחה!
              </div>
            )}
            <button
              onClick={loadContent}
              style={{ padding: '8px 14px', backgroundColor: C.bg3, border: `1px solid ${C.border}`, borderRadius: '4px', color: C.muted, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={13} />
              רענן
            </button>
            <button
              onClick={handleSave}
              disabled={pendingCount === 0 || saving}
              style={{
                padding: '8px 20px',
                backgroundColor: pendingCount > 0 ? C.accent : '#3a3939',
                border: 'none',
                borderRadius: '4px',
                color: pendingCount > 0 ? 'white' : C.muted,
                fontSize: '13px',
                fontWeight: 700,
                cursor: pendingCount > 0 ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Save size={14} />
              {saving ? 'שומר...' : pendingCount > 0 ? `שמור שינויים (${pendingCount})` : 'שמור שינויים'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: 'calc(100vh - 80px)' }}>
        {/* Sidebar */}
        <div style={{ backgroundColor: C.bg2, borderLeft: `1px solid ${C.border}`, padding: '16px 0' }}>
          {SECTIONS.map(sec => {
            const count = Object.values(changes).filter((_, i) =>
              Object.keys(changes)[i].startsWith(sec.id) || content[Object.keys(changes)[i]]?.section === sec.id
            ).length
            // Recalc properly
            const secChanges = Object.keys(changes).filter(k => content[k]?.section === sec.id).length

            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  textAlign: 'right',
                  background: activeSection === sec.id ? `${C.accent}22` : 'transparent',
                  border: 'none',
                  borderRight: activeSection === sec.id ? `3px solid ${C.accent}` : '3px solid transparent',
                  color: activeSection === sec.id ? 'white' : C.muted,
                  fontSize: '13px',
                  fontWeight: activeSection === sec.id ? 700 : 400,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  justifyContent: 'flex-start',
                }}
              >
                <span>{sec.icon}</span>
                <span style={{ flex: 1 }}>{sec.label}</span>
                {secChanges > 0 && (
                  <span style={{ backgroundColor: C.accent, color: 'white', fontSize: '10px', fontWeight: 800, borderRadius: '9999px', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {secChanges}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Content Editor */}
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ color: 'white', fontSize: '16px', fontWeight: 700, margin: 0 }}>
              {SECTIONS.find(s => s.id === activeSection)?.icon}{' '}
              {SECTIONS.find(s => s.id === activeSection)?.label}
            </h2>
            <p style={{ color: C.muted, fontSize: '12px', margin: '4px 0 0' }}>
              {sectionItems.length} שדות לעריכה
            </p>
          </div>

          {sectionItems.length === 0 ? (
            <div style={{ color: C.muted, textAlign: 'center', padding: '60px 0', fontSize: '14px' }}>
              אין תוכן לסעיף זה
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {sectionItems.map(item => (
                <ContentField
                  key={item.key}
                  item={item}
                  value={getValue(item.key)}
                  changed={item.key in changes}
                  onChange={(v) => handleChange(item.key, v)}
                  previewing={previewKey === item.key}
                  onTogglePreview={() => setPreviewKey(previewKey === item.key ? null : item.key)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface FieldProps {
  item: ContentItem
  value: string
  changed: boolean
  onChange: (v: string) => void
  previewing: boolean
  onTogglePreview: () => void
}

function ContentField({ item, value, changed, onChange, previewing, onTogglePreview }: FieldProps) {
  const isImage = item.type === 'image'
  const isLong = item.type === 'textarea' || (item.type === 'text' && item.label.includes('תיאור'))

  return (
    <div style={{
      backgroundColor: C.bg2,
      border: `1px solid ${changed ? C.accent : C.border}`,
      borderRadius: '6px',
      padding: '16px',
      transition: 'border-color 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isImage ? <Image size={14} style={{ color: C.accent }} /> : <Type size={14} style={{ color: C.muted }} />}
          <span style={{ color: 'white', fontSize: '13px', fontWeight: 600 }}>{item.label}</span>
          {changed && (
            <span style={{ backgroundColor: `${C.accent}33`, color: C.accent, fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '3px' }}>
              שונה
            </span>
          )}
        </div>
        {isImage && (
          <button
            onClick={onTogglePreview}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
          >
            {previewing ? <EyeOff size={13} /> : <Eye size={13} />}
            {previewing ? 'הסתר' : 'תצוגה'}
          </button>
        )}
      </div>

      {isImage ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="הדבק URL של תמונה..."
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: C.bg3,
              border: `1px solid ${changed ? C.accent : C.border}`,
              borderRadius: '4px',
              color: C.text,
              fontSize: '13px',
              outline: 'none',
              direction: 'ltr',
              textAlign: 'left',
              boxSizing: 'border-box',
            }}
          />
          {previewing && value && (
            <div style={{ borderRadius: '4px', overflow: 'hidden', border: `1px solid ${C.border}`, maxHeight: '200px' }}>
              <img
                src={value}
                alt={item.label}
                style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
          )}
          {value && (
            <p style={{ color: C.muted, fontSize: '11px', margin: 0, direction: 'ltr', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {value}
            </p>
          )}
        </div>
      ) : isLong ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: C.bg3,
            border: `1px solid ${changed ? C.accent : C.border}`,
            borderRadius: '4px',
            color: C.text,
            fontSize: '13px',
            outline: 'none',
            resize: 'vertical',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            lineHeight: 1.6,
          }}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: C.bg3,
            border: `1px solid ${changed ? C.accent : C.border}`,
            borderRadius: '4px',
            color: C.text,
            fontSize: '13px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      )}
    </div>
  )
}
