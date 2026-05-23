import { ShoppingCart, Phone, Mail, MapPin, Search, Facebook, Instagram, Youtube } from 'lucide-react'
import { useCartStore } from '../../store/cart'
import { useState } from 'react'

interface HeaderProps {
  onCartOpen?: () => void
  onSearch?: (q: string) => void
  contactEmail?: string
  contactAddress?: string
  contactHours?: string
  contactPhone?: string
}

const NAV_LINKS = [
  { label: 'ראשי', href: '#hero' },
  { label: 'אודות', href: '#about' },
  { label: 'תפריט', href: '#products' },
  { label: 'קטגוריות', href: '#categories' },
  { label: 'למה אנחנו', href: '#why' },
  { label: 'צור קשר', href: '#footer' },
]

export default function Header({ onCartOpen, onSearch, contactEmail = 'info@buffalo.co.il', contactAddress = 'הגפן 3, באר שבע', contactHours = 'א-ו: 7:00-20:00', contactPhone = '086500188' }: HeaderProps) {
  const { itemCount, estimatedTotal, openCart } = useCartStore()
  const count = itemCount()
  const total = estimatedTotal()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleCart = () => {
    openCart()
    onCartOpen?.()
  }

  return (
    <header className="w-full sticky top-0 z-50" style={{ direction: 'rtl' }}>
      {/* TOP BAR */}
      <div style={{ backgroundColor: '#151414', borderBottom: '1px solid #2a2929' }}>
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-5 text-gray-500">
            <a href={`mailto:${contactEmail}`} className="flex items-center gap-1.5 hover:text-orange-400 transition-colors">
              <Mail size={11} style={{ color: '#a8501e' }} />
              {contactEmail}
            </a>
            <span className="hidden sm:flex items-center gap-1.5">
              <MapPin size={11} style={{ color: '#a8501e' }} />
              <span>{contactAddress}</span>
            </span>
            <span className="hidden md:flex items-center gap-1.5">
              <Phone size={11} style={{ color: '#a8501e' }} />
              <span>{contactHours}</span>
            </span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <a href="#" className="hover:text-orange-400 transition-colors"><Facebook size={13} /></a>
            <a href="#" className="hover:text-orange-400 transition-colors"><Instagram size={13} /></a>
            <a href="#" className="hover:text-orange-400 transition-colors"><Youtube size={13} /></a>
          </div>
        </div>
      </div>

      {/* MAIN HEADER */}
      <div style={{ backgroundColor: '#0f0e0e', borderBottom: '1px solid #1e1d1d' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-4 gap-4">
            {/* Logo */}
            <a href="/" className="flex items-center gap-3 shrink-0">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-white text-xl"
                style={{ backgroundColor: '#a8501e' }}>B</div>
              <div>
                <div className="font-black text-white text-xl leading-none">באפלו מיטליז</div>
                <div className="text-xs font-semibold tracking-widest uppercase mt-0.5" style={{ color: '#a8501e' }}>כשר / חלק</div>
              </div>
            </a>

            {/* Nav desktop */}
            <nav className="hidden lg:flex items-center">
              {NAV_LINKS.map((link) => (
                <a key={link.label} href={link.href}
                  className="px-4 py-2 text-sm font-semibold text-gray-400 hover:text-orange-400 transition-colors uppercase tracking-wider whitespace-nowrap">
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {searchOpen ? (
                <div className="flex items-center rounded overflow-hidden border"
                  style={{ backgroundColor: '#1a1919', borderColor: '#2e2d2d' }}>
                  <input autoFocus type="text" value={searchVal}
                    onChange={(e) => { setSearchVal(e.target.value); onSearch?.(e.target.value) }}
                    placeholder="חיפוש..."
                    className="bg-transparent text-white text-sm px-3 py-2 outline-none w-32 placeholder-gray-600 text-right"
                    onBlur={() => { if (!searchVal) setSearchOpen(false) }} />
                  <button className="px-3" style={{ color: '#a8501e' }}><Search size={15} /></button>
                </div>
              ) : (
                <button onClick={() => setSearchOpen(true)} className="p-2 text-gray-500 hover:text-orange-400 transition-colors">
                  <Search size={18} />
                </button>
              )}
              <a href={`tel:${contactPhone}`}
                className="hidden md:flex items-center gap-2 text-sm px-3 py-2 text-gray-400 hover:text-orange-400 transition-colors">
                <Phone size={14} style={{ color: '#a8501e' }} />
                <span className="font-semibold">{contactPhone}</span>
              </a>
              <button onClick={handleCart}
                className="relative flex items-center gap-2 text-white font-bold text-sm px-5 py-2.5 uppercase tracking-wide"
                style={{ backgroundColor: '#a8501e', borderRadius: '3px' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#c0601f'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#a8501e'}>
                <ShoppingCart size={16} />
                {count > 0 ? (
                  <>
                    <span>&#8362;{total.toFixed(0)}</span>
                    <span className="absolute -top-1.5 -left-1.5 text-white text-xs font-black rounded-full w-5 h-5 flex items-center justify-center"
                      style={{ backgroundColor: '#e53e3e' }}>{count}</span>
                  </>
                ) : <span>הזמן עכשיו</span>}
              </button>
              <button onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 text-gray-400 hover:text-orange-400 transition-colors">
                <div className="flex flex-col gap-1.5">
                  <span className="block w-6 h-0.5 bg-current" />
                  <span className="block w-6 h-0.5 bg-current" />
                  <span className="block w-6 h-0.5 bg-current" />
                </div>
              </button>
            </div>
          </div>

          {mobileOpen && (
            <div className="lg:hidden border-t pb-4" style={{ borderColor: '#1e1d1d' }}>
              {NAV_LINKS.map((link) => (
                <a key={link.label} href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-2 py-3 text-sm font-semibold text-gray-400 hover:text-orange-40