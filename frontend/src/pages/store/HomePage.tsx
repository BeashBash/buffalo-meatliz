import { useState, useEffect, useRef } from 'react'
import { storeApi, adminApi } from '../../lib/api'
import type { Product, Category } from '../../types'
import Header from '../../components/store/Header'
import ProductCard from '../../components/store/ProductCard'
import CartDrawer from '../../components/store/CartDrawer'
import { useCartStore } from '../../store/cart'
import {
  Truck, Clock, Star, ChevronLeft, ChevronRight,
  Phone, MapPin, Mail, Facebook, Instagram, Youtube, ArrowLeft, CheckCircle2
} from 'lucide-react'

const C = {
  bg1: '#0f0e0e', bg2: '#1a1919', bg3: '#222121', bg4: '#151414',
  border: '#2a2929', accent: '#a8501e', accentH: '#c0601f',
  text: '#d1d0d0', muted: '#6b6a6a',
}

const SLIDES = [
  {
    tag: 'אטליז כשר / חלק',
    h1: ['היכרו עם', 'הקצבים', 'שלנו'],
    desc: 'בשר איכותי וטרי מדי יום — ישירות מהספק לצלחת שלך.',
    bg: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=1400&q=80',
    img: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&q=80',
  },
  {
    tag: 'חיתוך מקצועי',
    h1: ['חיתוכים', 'טריים', 'מדי יום'],
    desc: 'הקצבים שלנו יכינו לך בדיוק מה שרצית — חיתוך אישי וניקוי.',
    bg: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=1400&q=80',
    img: 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=600&q=80',
  },
  {
    tag: 'משלוח מהיר',
    h1: ['משלוח', 'אקספרס', 'עד הבית'],
    desc: 'מזמינים אונליין ומקבלים בשר טרי עד הדלת — מהיר וקל.',
    bg: 'https://images.unsplash.com/photo-1545367485-5f16ca582b8e?w=1400&q=80',
    img: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80',
  },
]

const CATS = [
  { name: 'בשר בקר', img: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=75' },
  { name: 'כבש', img: 'https://images.unsplash.com/photo-1573439307166-75b8e90c8429?w=600&q=75' },
  { name: 'עוף', img: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600&q=75' },
  { name: 'עגל', img: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&q=75' },
  { name: 'הודו', img: 'https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=600&q=75' },
  { name: 'נקניקיות', img: 'https://images.unsplash.com/photo-1619881586924-a24da04c9b0c?w=600&q=75' },
  { name: 'מרינייד', img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=75' },
  { name: 'מיוחד', img: 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=600&q=75' },
]

const WHY = [
  { img: 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=600&q=75', title: 'בריאות ובטיחות', desc: 'כל מוצר עובר בדיקת איכות לפני הגעתו — ללא פשרות.' },
  { img: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=75', title: '100% בשר טרי', desc: 'הבשר מגיע טרי מדי יום — אף פעם לא קפוא.' },
  { img: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&q=75', title: 'ללא חומרים מלאכותיים', desc: 'בשר נקי וטבעי ללא חומרי שימור או הורמונים.' },
  { img: 'https://images.unsplash.com/photo-1545367485-5f16ca582b8e?w=600&q=75', title: 'כשרות מהודרת', desc: 'תעודת כשרות חלק ובקר — לשביעות רצון כל הלקוחות.' },
]

const TESTS = [
  { name: 'דוד כהן', role: 'לקוח קבוע', text: 'הבשר הכי טרי שאי פעם קניתי. השירות מעולה ותמיד אפשר לסמוך על האיכות.', img: 'https://i.pravatar.cc/100?img=12' },
  { name: 'מרים לוי', role: 'מארגנת אירועים', text: 'הזמנתי בשר לאירוע של 100 איש — הכל הגיע מושלם וטרי. ממליצה בחום!', img: 'https://i.pravatar.cc/100?img=5' },
  { name: 'יוסי אברהם', role: 'שף ביתי', text: 'כאשף ביתי, איכות הבשר חשובה לי. באפלו מיטליז נותן בדיוק מה שאני מחפש.', img: 'https://i.pravatar.cc/100?img=8' },
]

const NEWS = [
  { date: '12 מאי', title: 'טיפים לשמירה נכונה על בשר טרי בבית', img: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&q=70' },
  { date: '5 אפריל', title: 'כל מה שצריך לדעת על כשרות בשר חלק', img: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=70' },
  { date: '20 מרץ', title: 'המדריך המלא לצלייה מושלמת על האש', img: 'https://images.unsplash.com/photo-1545367485-5f16ca582b8e?w=400&q=70' },
]

const GALLERY = [
  'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=300&q=70',
  'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=300&q=70',
  'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=300&q=70',
  'https://images.unsplash.com/photo-1545367485-5f16ca582b8e?w=300&q=70',
  'https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=300&q=70',
  'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=300&q=70',
]

function SecTitle({ sub, title }: { sub: string; title: string }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '56px' }}>
      <p style={{ color: C.accent, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.25em', marginBottom: '10px' }}>
        &#10022; {sub}
      </p>
      <h2 style={{ color: '#fff', fontSize: 'clamp(26px,4vw,46px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.1, margin: 0 }}>
        {title}
      </h2>
      <div style={{ width: '48px', height: '3px', backgroundColor: C.accent, margin: '14px auto 0' }} />
    </div>
  )
}

const BTN: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '8px',
  padding: '14px 30px', fontWeight: 700, fontSize: '12px',
  textTransform: 'uppercase', letterSpacing: '0.15em',
  borderRadius: '3px', cursor: 'pointer', transition: 'background 0.2s',
  textDecoration: 'none', border: 'none',
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [idx, setIdx] = useState(0)
  const [cm, setCm] = useState<Record<string, string>>({})
  const { openCart } = useCartStore()
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  // g(key, fallback) — get CMS value with hardcoded fallback
  const g = (key: string, fallback: string) => cm[key] || fallback

  useEffect(() => {
    Promise.all([
      storeApi.getCategories(),
      storeApi.getProducts(),
      adminApi.getSiteContentMap().catch(() => ({ data: {} })),
    ]).then(([c, p, sc]) => {
      setCategories(c.data)
      setProducts(p.data)
      setCm(sc.data as Record<string, string>)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const p = activeCategory === 'all' ? storeApi.getProducts() : storeApi.getProducts(activeCategory)
    p.then(r => setProducts(r.data))
  }, [activeCategory])

  useEffect(() => {
    timer.current = setInterval(() => setIdx(i => (i + 1) % SLIDES.length), 5500)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [])

  const filtered = searchQuery
    ? products.filter(p => p.name_he.includes(searchQuery) || p.description_he?.includes(searchQuery))
    : products

  // Build slides dynamically from CMS (falls back to SLIDES constants)
  const DYNAMIC_SLIDES = [
    {
      tag: g('hero_slide1_tag', SLIDES[0].tag),
      h1: [
        g('hero_slide1_title1', SLIDES[0].h1[0]),
        g('hero_slide1_title2', SLIDES[0].h1[1]),
        SLIDES[0].h1[2],
      ],
      desc: g('hero_slide1_desc', SLIDES[0].desc),
      bg:  g('hero_slide1_bg',  SLIDES[0].bg),
      img: g('hero_slide1_img', SLIDES[0].img),
    },
    {
      tag: g('hero_slide2_tag', SLIDES[1].tag),
      h1: [
        g('hero_slide2_title1', SLIDES[1].h1[0]),
        g('hero_slide2_title2', SLIDES[1].h1[1]),
        SLIDES[1].h1[2],
      ],
      desc: g('hero_slide2_desc', SLIDES[1].desc),
      bg:  g('hero_slide2_bg',  SLIDES[1].bg),
      img: g('hero_slide2_img', SLIDES[1].img),
    },
    SLIDES[2],
  ]
  const slide = DYNAMIC_SLIDES[idx % DYNAMIC_SLIDES.length]

  // Dynamic WHY cards
  const DYNAMIC_WHY = WHY.map((w, i) => ({
    img:   g(`why_card${i+1}_img`,   w.img),
    title: g(`why_card${i+1}_title`, w.title),
    desc:  g(`why_card${i+1}_desc`,  w.desc),
  }))

  // Dynamic testimonials
  const DYNAMIC_TESTS = TESTS.map((t, i) => ({
    ...t,
    name: g(`testimonial${i+1}_name`, t.name),
    text: g(`testimonial${i+1}_text`, t.text),
  }))

  // Dynamic news
  const DYNAMIC_NEWS = NEWS.map((n, i) => ({
    ...n,
    title: g(`news${i+1}_title`, n.title),
    img:   g(`news${i+1}_img`,   n.img),
  }))

  // Dynamic gallery
  const DYNAMIC_GALLERY = GALLERY.map((img, i) => g(`gallery_img${i+1}`, img))

  return (
    <div style={{ backgroundColor: C.bg1, direction: 'rtl', color: C.text, minHeight: '100vh' }}>
      <Header
        onCartOpen={openCart}
        onSearch={setSearchQuery}
        contactEmail={g('contact_email', 'info@buffalo.co.il')}
        contactAddress={g('contact_address', 'הגפן 3, באר שבע')}
        contactHours={g('contact_hours', 'א-ו: 7:00-20:00')}
        contactPhone={g('contact_phone', '086500188')}
      />
      <CartDrawer />

      {/* ===== HERO ===== */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${slide.bg})`, backgroundSize: 'cover', backgroundPosition: 'center', transition: 'opacity 1s' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(8,7,7,0.90)' }} />
        <div className="max-w-7xl mx-auto px-6 w-full" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }}>
            {/* Text */}
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: C.accent, fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.25em', marginBottom: '18px' }}>
                &#10022; {slide.tag}
              </p>
              <h1 style={{ fontSize: 'clamp(38px,6vw,78px)', fontWeight: 900, color: '#fff', lineHeight: 1.05, textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '-0.02em' }}>
                {slide.h1[0]}<br />
                <span style={{ color: C.accent }}>{slide.h1[1]}</span><br />
                {slide.h1[2]}
              </h1>
              <p style={{ color: C.muted, fontSize: '15px', lineHeight: 1.8, maxWidth: '440px', marginBottom: '32px' }}>{slide.desc}</p>
              <div style={{ display: 'flex', gap: '14px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <a href="#products" style={{ ...BTN, backgroundColor: C.accent, color: '#fff' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = C.accentH}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = C.accent}>
                  לתפריט המלא
                </a>
                <a href="#about" style={{ ...BTN, backgroundColor: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.accent; el.style.color = '#f97316' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.25)'; el.style.color = '#fff' }}>
                  אודות האטליז
                </a>
              </div>
            </div>
            {/* Circular image */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', minHeight: '400px' }}>
              <div style={{ position: 'absolute', width: '440px', height: '440px', borderRadius: '50%', border: `1px solid ${C.accent}30`, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
              <div style={{ position: 'absolute', width: '360px', height: '360px', borderRadius: '50%', backgroundColor: `${C.accent}10`, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
              <img src={slide.img} alt="בשר"
                style={{ width: '360px', height: '360px', objectFit: 'cover', borderRadius: '50%', border: `4px solid ${C.accent}50`, boxShadow: `0 0 80px ${C.accent}25`, position: 'relative', zIndex: 1 }} />
              <a href="tel:086500188" style={{ position: 'absolute', bottom: '30px', left: '60px', width: '58px', height: '58px', borderRadius: '50%', backgroundColor: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 0 10px ${C.accent}20`, zIndex: 2 }}>
                <Phone size={22} color="#fff" />
              </a>
            </div>
          </div>
        </div>
        {/* Arrows */}
        {[-1, 1].map((dir, i) => (
          <button key={i} onClick={() => setIdx(x => (x + dir + SLIDES.length) % SLIDES.length)}
            style={{ position: 'absolute', [i === 0 ? 'left' : 'right']: '20px', top: '50%', transform: 'translateY(-50%)', width: '48px', height: '48px', border: `1px solid ${C.border}`, borderRadius: '3px', backgroundColor: 'transparent', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2, transition: 'all 0.2s' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = C.accent; el.style.borderColor = C.accent }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = 'transparent'; el.style.borderColor = C.border }}>
            {i === 0 ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        ))}
        {/* Dots */}
        <div style={{ position: 'absolute', bottom: '28px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 2 }}>
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} style={{ width: i === idx ? '36px' : '10px', height: '4px', borderRadius: '2px', backgroundColor: i === idx ? C.accent : 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', transition: 'all 0.3s' }} />
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: '32px', right: '28px', color: 'rgba(255,255,255,0.25)', fontSize: '13px', fontWeight: 700 }}>
          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '26px', fontWeight: 900 }}>0{idx + 1}</span> / 0{SLIDES.length}
        </div>
      </section>

      {/* ===== ABOUT ===== */}
      <section id="about" style={{ backgroundColor: C.bg3, padding: '96px 0' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '56px', alignItems: 'center' }}>
            {/* Images */}
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <img src="https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=400&q=80" alt="אטליז"
                  style={{ width: '100%', height: '270px', objectFit: 'cover', borderRadius: '4px' }} />
                <img src="https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&q=80" alt="בשר"
                  style={{ width: '100%', height: '270px', objectFit: 'cover', borderRadius: '4px', marginTop: '36px' }} />
              </div>
              <div style={{ position: 'absolute', bottom: '-16px', left: '-16px', backgroundColor: C.accent, color: '#fff', padding: '18px 22px', borderRadius: '4px', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                <div style={{ fontSize: '44px', fontWeight: 900, lineHeight: 1 }}>15</div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.85, marginTop: '4px' }}>שנות<br />ניסיון</div>
              </div>
            </div>
            {/* Text */}
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: C.accent, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.25em', marginBottom: '10px' }}>&#10022; אודות באפלו מיטליז</p>
              <h2 style={{ fontSize: 'clamp(26px,4vw,46px)', fontWeight: 900, color: '#fff', lineHeight: 1.1, textTransform: 'uppercase', marginBottom: '16px' }}>
                חיתוכים טריים<br /><span style={{ color: C.accent }}>אטליז כשר</span><br />בלב העיר
              </h2>
              <div style={{ width: '44px', height: '3px', backgroundColor: C.accent, marginRight: 'auto', marginBottom: '18px' }} />
              <p style={{ color: C.muted, fontSize: '15px', lineHeight: 1.8, marginBottom: '22px' }}>
                אנחנו מספקים ללקוחותינו בשר טרי ואיכותי מאז 2009. כל יום מגיע אלינו בשר מספקים מוסמכים עם כשרות מהודרת ושירות אישי.
              </p>
              {['בריאות ובטיחות', '100% תוצרת טרייה', 'איכות הבשר'].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end', marginBottom: '8px' }}>
                  <span style={{ color: C.text, fontSize: '14px', fontWeight: 600 }}>{item}</span>
                  <CheckCircle2 size={16} style={{ color: C.accent, flexShrink: 0 }} />
                </div>
              ))}
              <div style={{ margin: '18px 0 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#fff', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>איכות הבשר</span>
                  <span style={{ color: C.accent, fontSize: '12px', fontWeight: 700 }}>95%</span>
                </div>
                <div style={{ height: '4px', backgroundColor: C.border, borderRadius: '2px' }}>
                  <div style={{ height: '100%', width: '95%', backgroundColor: C.accent, borderRadius: '2px' }} />
                </div>
              </div>
              <a href="#products" style={{ ...BTN, backgroundColor: C.accent, color: '#fff' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = C.accentH}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = C.accent}>
                אודות האטליז
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STRIP ===== */}
      <div style={{ backgroundColor: C.bg2, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '20px 0' }}>
        <div className="max-w-7xl mx-auto px-6" style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '16px' }}>
          {['כשר למהדרין', 'ללא הורמונים', 'משלוח יומי', 'מחיר לפי שקילה', 'חיתוך מקצועי'].map(t => (
            <span key={t} style={{ color: C.muted, fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* ===== PRODUCTS ===== */}
      <section id="products" style={{ backgroundColor: C.bg1, padding: '96px 0' }}>
        <div className="max-w-7xl mx-auto px-6">
          <SecTitle sub="מוצרים מובחרים" title="המוצרים הפופולריים שלנו" />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '36px' }}>
            {[{ slug: 'all', name_he: 'הכל' }, ...categories].map(cat => (
              <button key={cat.slug} onClick={() => setActiveCategory(cat.slug)}
                style={{ padding: '9px 22px', borderRadius: '3px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', border: `1px solid ${activeCategory === cat.slug ? C.accent : C.border}`, backgroundColor: activeCategory === cat.slug ? C.accent : 'transparent', color: activeCategory === cat.slug ? '#fff' : C.muted, transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                {cat.name_he}
              </button>
            ))}
          </div>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: '20px' }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ backgroundColor: C.bg2, borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ paddingTop: '100%', backgroundColor: 'rgba(255,255,255,0.03)' }} />
                  <div style={{ padding: '14px' }}>
                    <div style={{ height: '14px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '2px', marginBottom: '8px' }} />
                    <div style={{ height: '10px', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '2px', width: '60%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: C.muted }}>
              <p style={{ fontSize: '56px', marginBottom: '14px' }}>&#x1F969;</p>
              <p style={{ fontSize: '18px' }}>אין מוצרים זמינים כעת</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: '20px' }}>
              {filtered.map(product => <ProductCard key={product.id} product={product} dark />)}
            </div>
          )}
        </div>
      </section>

      {/* ===== CATEGORIES GRID ===== */}
      <section id="categories" style={{ backgroundColor: C.bg3, padding: '96px 0' }}>
        <div className="max-w-7xl mx-auto px-6">
          <SecTitle sub="הבחירה הראשונה" title="קטגוריות הבשר הטובות ביותר" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gridTemplateRows: 'auto auto', gap: '4px' }}>
            <div style={{ gridColumn: 'span 2', position: 'relative', overflow: 'hidden', height: '300px', borderRadius: '3px', cursor: 'pointer' }}
              onMouseEnter={e => { const img = (e.currentTarget as HTMLElement).querySelector('img') as HTMLImageElement; if(img) img.style.transform='scale(1.08)' }}
              onMouseLeave={e => { const img = (e.currentTarget as HTMLElement).querySelector('img') as HTMLImageElement; if(img) img.style.transform='scale(1)' }}>
              <img src={CATS[0].img} alt={CATS[0].name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.8) 0%,rgba(0,0,0,0.1) 60%)' }} />
              <div style={{ position: 'absolute', bottom: '20px', right: '20px' }}>
                <div style={{ backgroundColor: C.accent, width: '30px', height: '2px', marginBottom: '8px' }} />
                <h3 style={{ color: '#fff', fontSize: '22px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>{CATS[0].name}</h3>
              </div>
            </div>
            {CATS.slice(1, 5).map(cat => (
              <div key={cat.name} style={{ position: 'relative', overflow: 'hidden', height: '300px', borderRadius: '3px', cursor: 'pointer' }}
                onMouseEnter={e => { const img = (e.currentTarget as HTMLElement).querySelector('img') as HTMLImageElement; if(img) img.style.transform='scale(1.08)' }}
                onMouseLeave={e => { const img = (e.currentTarget as HTMLElement).querySelector('img') as HTMLImageElement; if(img) img.style.transform='scale(1)' }}>
                <img src={cat.img} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.75) 0%,transparent 55%)' }} />
                <h3 style={{ position: 'absolute', bottom: '16px', right: '16px', color: '#fff', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>{cat.name}</h3>
              </div>
            ))}
            {CATS.slice(5).map(cat => (
              <div key={cat.name} style={{ position: 'relative', overflow: 'hidden', height: '200px', borderRadius: '3px', cursor: 'pointer' }}
                onMouseEnter={e => { const img = (e.currentTarget as HTMLElement).querySelector('img') as HTMLImageElement; if(img) img.style.transform='scale(1.08)' }}
                onMouseLeave={e => { const img = (e.currentTarget as HTMLElement).querySelector('img') as HTMLImageElement; if(img) img.style.transform='scale(1)' }}>
                <img src={cat.img} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.75) 0%,transparent 55%)' }} />
                <h3 style={{ position: 'absolute', bottom: '14px', right: '14px', color: '#fff', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>{cat.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== DELIVERY ===== */}
      <section style={{ backgroundColor: C.bg1, padding: '96px 0' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '56px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: C.accent, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.25em', marginBottom: '10px' }}>&#10022; שירות משלוחים</p>
              <h2 style={{ fontSize: 'clamp(26px,4vw,44px)', fontWeight: 900, color: '#fff', lineHeight: 1.1, textTransform: 'uppercase', marginBottom: '16px' }}>
                משלוח אקספרס<br /><span style={{ color: C.accent }}>עד הבית שלך</span>
              </h2>
              <div style={{ width: '44px', height: '3px', backgroundColor: C.accent, marginRight: 'auto', marginBottom: '18px' }} />
              <p style={{ color: C.muted, fontSize: '15px', lineHeight: 1.8, marginBottom: '28px' }}>
                באפלו מיטליז מספק שירות משלוחים מהיר לכל האזור. בשר טרי ואיכותי מגיע ישירות לדלת שלך — מאורז היטב ובזמן שסיכמנו.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', justifyContent: 'flex-end', marginBottom: '28px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: C.muted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '3px' }}>להזמנת משלוח</div>
                  <a href="tel:086500188" style={{ color: '#fff', fontSize: '22px', fontWeight: 900, textDecoration: 'none' }}>086500188</a>
                </div>
                <div style={{ width: '48px', height: '48px', backgroundColor: C.accent, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Phone size={20} color="#fff" />
                </div>
              </div>
              <a href="#products" style={{ ...BTN, backgroundColor: C.accent, color: '#fff' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = C.accentH}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = C.accent}>
                הזמן עכשיו
              </a>
            </div>
            <div style={{ position: 'relative' }}>
              <img src="https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600&q=80" alt="משלוח"
                style={{ width: '100%', height: '400px', objectFit: 'cover', borderRadius: '4px' }} />
              <div style={{ position: 'absolute', bottom: '-16px', right: '-16px', backgroundColor: C.bg2, border: `1px solid ${C.border}`, padding: '14px 18px', borderRadius: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Truck size={26} style={{ color: C.accent }} />
                  <div>
                    <div style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>משלוח מהיר</div>
                    <div style={{ color: C.muted, fontSize: '12px' }}>לכל האזור</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHY CHOOSE — IMAGE CARDS ===== */}
      <section id="why" style={{ backgroundColor: C.bg3, padding: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
          {DYNAMIC_WHY.map(item => (
            <div key={item.title} style={{ position: 'relative', overflow: 'hidden', height: '360px', cursor: 'pointer' }}
              onMouseEnter={e => { const img = (e.currentTarget as HTMLElement).querySelector('img') as HTMLImageElement; if(img) img.style.transform='scale(1.08)' }}
              onMouseLeave={e => { const img = (e.currentTarget as HTMLElement).querySelector('img') as HTMLImageElement; if(img) img.style.transform='scale(1)' }}>
              <img src={item.img} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0.3) 55%)' }} />
              <div style={{ position: 'absolute', bottom: 0, right: 0, left: 0, padding: '24px 20px', textAlign: 'right' }}>
                <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>{item.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', lineHeight: 1.6, marginBottom: '14px' }}>{item.desc}</p>
                <span style={{ color: C.accent, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  קרא עוד <ArrowLeft size={11} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section style={{ backgroundColor: C.bg2, padding: '96px 0' }}>
        <div className="max-w-7xl mx-auto px-6">
          <SecTitle sub="מה הלקוחות אומרים" title="מה הם מדברים עלינו" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '22px' }}>
            {DYNAMIC_TESTS.map((t, i) => (
              <div key={i} style={{ backgroundColor: C.bg3, border: `1px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: '4px', padding: '28px', textAlign: 'right', transition: 'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = C.accent}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}>
                <div style={{ fontSize: '44px', color: C.accent, fontWeight: 900, lineHeight: 1, marginBottom: '10px' }}>"</div>
                <div style={{ display: 'flex', gap: '3px', marginBottom: '14px', justifyContent: 'flex-end' }}>
                  {[1,2,3,4,5].map(j => <Star key={j} size={13} style={{ color: C.accent, fill: C.accent }} />)}
                </div>
                <p style={{ color: C.muted, fontSize: '14px', lineHeight: 1.8, marginBottom: '20px' }}>{t.text}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end' }}>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px', textTransform: 'uppercase' }}>{t.name}</div>
                    <div style={{ color: C.accent, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t.role}</div>
                  </div>
                  <img src={t.img} alt={t.name} style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.accent}` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHY CHOOSE FEATURES ===== */}
      <section style={{ backgroundColor: C.bg1, padding: '96px 0' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '56px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: C.accent, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.25em', marginBottom: '10px' }}>&#10022; למה לבחור בנו</p>
              <h2 style={{ fontSize: 'clamp(26px,4vw,44px)', fontWeight: 900, color: '#fff', lineHeight: 1.1, textTransform: 'uppercase', marginBottom: '16px' }}>
                כמה סיבות טובות<br /><span style={{ color: C.accent }}>לבחור באטליז שלנו</span>
              </h2>
              <div style={{ width: '44px', height: '3px', backgroundColor: C.accent, marginRight: 'auto', marginBottom: '18px' }} />
              <p style={{ color: C.muted, fontSize: '15px', lineHeight: 1.8, marginBottom: '28px' }}>
                האטליז שלנו מציע את הבשר הטרי והאיכותי ביותר — מגוון עשיר של חיתוכים, כשרות מהודרת, ושירות אישי ומסור.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {['100% בקרת איכות', 'ללא חומרים מלאכותיים', '100% תוצרת טרייה', 'בריאות ובטיחות'].map(f => (
                  <div key={f} style={{ border: `1px solid ${C.border}`, borderRadius: '4px', padding: '18px', textAlign: 'right', transition: 'border-color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = C.accent}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}>
                    <div style={{ width: '34px', height: '34px', backgroundColor: `${C.accent}18`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 'auto', marginBottom: '10px' }}>
                      <CheckCircle2 size={16} style={{ color: C.accent }} />
                    </div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase' }}>{f}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <img src="https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=600&q=80" alt="למה אנחנו"
                style={{ width: '100%', height: '500px', objectFit: 'cover', borderRadius: '4px' }} />
              <div style={{ position: 'absolute', top: '28px', right: '-16px', backgroundColor: C.accent, color: '#fff', padding: '18px 22px', borderRadius: '4px', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                <div style={{ fontSize: '38px', fontWeight: 900, lineHeight: 1 }}>5K+</div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.85, marginTop: '4px' }}>לקוחות<br />מרוצים</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== NEWS ===== */}
      <section style={{ backgroundColor: C.bg3, padding: '96px 0' }}>
        <div className="max-w-7xl mx-auto px-6">
          <SecTitle sub="חדשות ועדכונים" title="חדשות אחרונות מהאטליז" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '22px' }}>
            {DYNAMIC_NEWS.map((n, i) => (
              <article key={i} style={{ backgroundColor: C.bg2, border: `1px solid ${C.border}`, borderRadius: '4px', overflow: 'hidden', transition: 'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = C.accent}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}>
                <div style={{ position: 'relative', overflow: 'hidden', height: '210px' }}
                  onMouseEnter={e => { const img = (e.currentTarget as HTMLElement).querySelector('img') as HTMLImageElement; if(img) img.style.transform='scale(1.08)' }}
                  onMouseLeave={e => { const img = (e.currentTarget as HTMLElement).querySelector('img') as HTMLImageElement; if(img) img.style.transform='scale(1)' }}>
                  <img src={n.img} alt={n.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} />
                  <div style={{ position: 'absolute', top: '14px', right: '14px', backgroundColor: C.accent, color: '#fff', padding: '5px 12px', borderRadius: '3px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{n.date}</div>
                </div>
                <div style={{ padding: '22px', textAlign: 'right' }}>
                  <p style={{ color: C.muted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>מאת: המערכת</p>
                  <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 900, lineHeight: 1.4, marginBottom: '14px', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.accent}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#fff'}>
                    {n.title}
                  </h3>
                  <a href="#" style={{ color: C.accent, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                    קרא עוד <ArrowLeft size={11} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer id="footer" style={{ backgroundColor: C.bg4, borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', gap: '36px', textAlign: 'right' }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end', marginBottom: '18px' }}>
                <div>
                  <div style={{ color: '#fff', fontWeight: 900, fontSize: '20px', textTransform: 'uppercase' }}>באפלו מיטליז</div>
                  <div style={{ color: C.accent, fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase' }}>כשר / חלק</div>
                </div>
                <div style={{ width: '46px', height: '46px', backgroundColor: C.accent, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fff', fontSize: '20px' }}>B</div>
              </div>
              <p style={{ color: C.muted, fontSize: '14px', lineHeight: 1.8, marginBottom: '20px' }}>מספקים בשר טרי ואיכותי מהחווה ישירות לצלחת שלך — בצורה הכי טבעית.</p>
              <div style={{ display: 'flex', borderRadius: '3px', overflow: 'hidden' }}>
                <input type="email" placeholder="האימייל שלך..."
                  style={{ flex: 1, backgroundColor: C.bg2, border: `1px solid ${C.border}`, borderLeft: 'none', padding: '11px 14px', color: '#fff', fontSize: '13px', outline: 'none', textAlign: 'right' }} />
                <button style={{ backgroundColor: C.accent, color: '#fff', padding: '11px 18px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', border: 'none', cursor: 'pointer' }}>שלח</button>
              </div>
            </div>
            {/* Links */}
            <div>
              <h4 style={{ color: '#fff', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '13px', marginBottom: '18px' }}>ניווט</h4>
              {['אודות', 'הזמנה', 'תפריט', 'מבצעים', 'צור קשר'].map(l => (
                <div key={l} style={{ marginBottom: '9px' }}>
                  <a href="#" style={{ color: C.muted, fontSize: '14px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#f97316'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.muted}>
                    {l} <span style={{ width: '4px', height: '4px', backgroundColor: C.accent, borderRadius: '50%', flexShrink: 0 }} />
                  </a>
                </div>
              ))}
            </div>
            {/* Contact */}
            <div>
              <h4 style={{ color: '#fff', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '13px', marginBottom: '18px' }}>צרו קשר</h4>
              {[
                { Icon: MapPin, text: g('contact_address', 'הגפן 3, באר שבע') },
                { Icon: Phone, text: g('contact_phone', '086500188'), href: `tel:${g('contact_phone','086500188')}` },
                { Icon: Mail, text: g('contact_email', 'info@buffalo.co.il'), href: `mailto:${g('contact_email','info@buffalo.co.il')}` },
                { Icon: Clock, text: g('contact_hours', 'א-ו: 7:00-20:00') },
              ].map(({ Icon, text, href }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', justifyContent: 'flex-end', marginBottom: '10px' }}>
                  <a href={href || '#'} style={{ color: C.muted, fontSize: '14px', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#f97316'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.muted}>{text}</a>
                  <Icon size={13} style={{ color: C.accent, flexShrink: 0, marginTop: '3px' }} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '14px' }}>
                {