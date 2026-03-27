'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

const primaryNav = [
  { href: '/hem',       label: 'Hem',        icon: HemIcon },
  { href: '/kalender',  label: 'Kalender',   icon: KalenderIcon },
  { href: '/uppgifter', label: 'Uppgifter',  icon: UppgifterIcon },
  { href: '/ekonomi',   label: 'Ekonomi',    icon: EkonomiIcon },
  { href: '/arkiv',     label: 'Arkiv',      icon: ArkivIcon },
]

const newNav = [
  { href: '/rakningar', label: 'Räkningar',  icon: RakningarIcon },
  { href: '/projekt',   label: 'Projekt',    icon: ProjektIcon },
  { href: '/mat',       label: 'Mat & Hälsa', icon: MatIcon },
  { href: '/mail',      label: 'Mail',       icon: MailIcon },
]

const sidebarExtra = [
  { href: '/foretag', label: 'Företag', icon: ForetagIcon },
]

// Mobile bottom bar: 5 fixed items
const mobileBottomNav = [
  { href: '/hem',       label: 'Hem',        icon: HemIcon },
  { href: '/rakningar', label: 'Räkningar',  icon: RakningarIcon },
  { href: '/mail',      label: 'Mail',       icon: MailIcon },
  { href: '/projekt',   label: 'Projekt',    icon: ProjektIcon },
]

// Items shown in the "Mer" drawer
const merDrawerNav = [
  { href: '/kalender',  label: 'Kalender',   icon: KalenderIcon },
  { href: '/uppgifter', label: 'Uppgifter',  icon: UppgifterIcon },
  { href: '/ekonomi',   label: 'Ekonomi',    icon: EkonomiIcon },
  { href: '/arkiv',     label: 'Arkiv',      icon: ArkivIcon },
  { href: '/mat',       label: 'Mat & Hälsa', icon: MatIcon },
]

export default function Navigation() {
  const path = usePathname()
  const router = useRouter()
  const [showMore, setShowMore] = useState(false)

  if (path === '/onboarding' || path === '/') return null

  // Is current path one of the "Mer" drawer items?
  const merActive = merDrawerNav.some(item => path.startsWith(item.href))

  function handleDrawerNav(href: string) {
    setShowMore(false)
    router.push(href)
  }

  return (
    <>
      {/* Mobile bottom bar — 5 fixed items */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          background: 'rgba(13,13,26,0.94)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
        <div className="flex h-16">
          {mobileBottomNav.map(({ href, label, icon: Icon }) => {
            const active = path.startsWith(href)
            return (
              <Link key={href} href={href}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-all"
                style={{ color: active ? '#7B6EFF' : '#555570' }}>
                <Icon active={active} />
                <span className="text-[9px] font-semibold tracking-wide leading-none whitespace-nowrap">{label}</span>
              </Link>
            )
          })}

          {/* Mer button */}
          <button
            onClick={() => setShowMore(s => !s)}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-all"
            style={{ color: merActive || showMore ? '#7B6EFF' : '#555570' }}>
            <MerIcon active={merActive || showMore} />
            <span className="text-[9px] font-semibold tracking-wide leading-none">Mer</span>
          </button>
        </div>
      </nav>

      {/* "Mer" drawer */}
      {showMore && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[60] md:hidden"
            onClick={() => setShowMore(false)}
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          />
          {/* Drawer sheet */}
          <div
            className="fixed left-0 right-0 z-[70] md:hidden"
            style={{
              bottom: 'calc(64px + env(safe-area-inset-bottom))',
              background: 'rgba(13,13,26,0.97)',
              backdropFilter: 'blur(20px)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px 20px 0 0',
              padding: '16px 16px 8px',
            }}>
            <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.15)' }} />
            <div className="text-[10px] font-bold tracking-widest uppercase mb-3 px-2" style={{ color: '#333355' }}>
              Mer
            </div>
            <div className="grid grid-cols-2 gap-2">
              {merDrawerNav.map(({ href, label, icon: Icon }) => {
                const active = path.startsWith(href)
                return (
                  <button
                    key={href}
                    onClick={() => handleDrawerNav(href)}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left"
                    style={{
                      background: active ? 'rgba(123,110,255,0.15)' : 'rgba(255,255,255,0.04)',
                      color: active ? '#9D93FF' : '#9898B8',
                      border: active ? '1px solid rgba(123,110,255,0.3)' : '1px solid rgba(255,255,255,0.06)',
                    }}>
                    <Icon active={active} />
                    <span className="text-sm font-semibold">{label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}

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
        <div className="flex-1 px-3 py-2 space-y-0.5">
          {primaryNav.map(({ href, label, icon: Icon }) => {
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

          <div className="my-2 mx-3" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
          <div className="px-3 pb-1 text-[10px] font-bold tracking-widest uppercase" style={{ color: '#333355' }}>Nytt</div>

          {[...newNav, ...sidebarExtra].map(({ href, label, icon: Icon }) => {
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
function MatIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#00C896' : '#555570'} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a5 5 0 015 5c0 3-2 5-5 7-3-2-5-4-5-7a5 5 0 015-5z"/>
      <path d="M12 22V14"/>
      <path d="M8 18h8"/>
    </svg>
  )
}
function MerIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#7B6EFF' : '#555570'} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
    </svg>
  )
}
