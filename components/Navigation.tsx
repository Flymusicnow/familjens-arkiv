'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/hem',       label: 'Hem',        icon: HemIcon },
  { href: '/kalender',  label: 'Kalender',   icon: KalenderIcon },
  { href: '/uppgifter', label: 'Uppgifter',  icon: UppgifterIcon },
  { href: '/ekonomi',   label: 'Ekonomi',    icon: EkonomiIcon },
  { href: '/arkiv',     label: 'Arkiv',      icon: ArkivIcon },
  { href: '/rakningar', label: 'Räkningar',  icon: RakningarIcon },
  { href: '/projekt',   label: 'Projekt',    icon: ProjektIcon },
  { href: '/mail',      label: 'Mail',       icon: MailIcon },
]

const sidebarExtra = [
  { href: '/foretag', label: 'Företag', icon: ForetagIcon },
]

export default function Navigation() {
  const path = usePathname()
  if (path === '/onboarding' || path === '/') return null

  return (
    <>
      {/* Mobile bottom bar — horizontally scrollable */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          background: 'rgba(13,13,26,0.94)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
        <div className="flex overflow-x-auto h-16 px-2 gap-1" style={{ scrollbarWidth: 'none' }}>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = path.startsWith(href)
            return (
              <Link key={href} href={href}
                className="flex flex-col items-center justify-center gap-0.5 flex-shrink-0 px-3 py-2 transition-all"
                style={{ color: active ? '#7B6EFF' : '#555570', minWidth: 56 }}>
                <Icon active={active} />
                <span className="text-[9px] font-semibold tracking-wide leading-none whitespace-nowrap">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-56 flex-col z-50 overflow-y-auto"
        style={{
          background: 'rgba(13,13,26,0.96)',
          backdropFilter: 'blur(16px)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
        }}>
        <div className="px-5 pt-8 pb-4 flex-shrink-0">
          <div className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: '#555570' }}>
            Familjens
          </div>
          <div className="text-xl font-extrabold" style={{ color: '#F2F2FF', letterSpacing: '-0.5px' }}>
            Arkiv
          </div>
        </div>
        <div className="flex-1 px-3 py-2 space-y-1">
          {[...navItems, ...sidebarExtra].map(({ href, label, icon: Icon }) => {
            const active = path.startsWith(href)
            return (
              <Link key={href} href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                style={{
                  background: active ? 'rgba(123,110,255,0.15)' : 'transparent',
                  color: active ? '#9D93FF' : '#9898B8',
                }}>
                <Icon active={active} />
                <span className="text-sm font-semibold">{label}</span>
              </Link>
            )
          })}
        </div>
      </aside>
    </>
  )
}

/* ── Icon components ── */
function HemIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#7B6EFF' : '#555570'} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}
function KalenderIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#7B6EFF' : '#555570'} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}
function UppgifterIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#7B6EFF' : '#555570'} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4"/>
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
    </svg>
  )
}
function EkonomiIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#7B6EFF' : '#555570'} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  )
}
function ArkivIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#7B6EFF' : '#555570'} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
    </svg>
  )
}
function ForetagIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#7B6EFF' : '#555570'} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
    </svg>
  )
}
function RakningarIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#FF4B6E' : '#555570'} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <line x1="2" y1="10" x2="22" y2="10"/>
      <line x1="6" y1="15" x2="9" y2="15"/>
      <line x1="12" y1="15" x2="15" y2="15"/>
    </svg>
  )
}
function ProjektIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#00C896' : '#555570'} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  )
}
function MailIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#38B6FF' : '#555570'} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  )
}
