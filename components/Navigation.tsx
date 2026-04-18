'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

// ── Nav data ──────────────────────────────────────────────────────────────────

type NavEntry = { href: string; label: string; icon: (active: boolean) => React.ReactNode; color: string }

const section1: NavEntry[] = [
  { href: '/hem',       label: 'Hem',        icon: HomeIcon,       color: '#6450B4' },
  { href: '/rakningar', label: 'Räkningar',  icon: CardIcon,       color: '#C46040' },
  { href: '/ekonomi',   label: 'Ekonomi',    icon: CoinsIcon,      color: '#5A9A50' },
  { href: '/mail',      label: 'Mail',       icon: MailIcon,       color: '#4A8CB4' },
]

const section2: NavEntry[] = [
  { href: '/kalender',    label: 'Kalender',    icon: CalendarIcon,   color: '#B45070' },
  { href: '/uppgifter',   label: 'Uppgifter',   icon: CheckIcon,      color: '#9A7830' },
  { href: '/mat',         label: 'Mat & Hälsa', icon: LeafIcon,       color: '#6AA860' },
  { href: '/aktiviteter', label: 'Aktiviteter', icon: ActivityIcon,   color: '#6AA860' },
]

const section3: NavEntry[] = [
  { href: '/arkiv',    label: 'Arkiv',    icon: FolderIcon,   color: '#907060' },
  { href: '/projekt',  label: 'Projekt',  icon: BarChartIcon, color: '#6450B4' },
  { href: '/studera',  label: 'Studera',  icon: BookIcon,     color: '#4A8CB4' },
  { href: '/paddan',   label: 'Paddan',   icon: HeartIcon,    color: '#3A8878' },
]

const mobileMain: NavEntry[] = [
  { href: '/hem',       label: 'Hem',       icon: HomeIcon,     color: '#6450B4' },
  { href: '/rakningar', label: 'Räkningar', icon: CardIcon,     color: '#C46040' },
  { href: '/mail',      label: 'Mail',      icon: MailIcon,     color: '#4A8CB4' },
  { href: '/projekt',   label: 'Projekt',   icon: BarChartIcon, color: '#6450B4' },
]

const merDrawer: NavEntry[] = [
  { href: '/kalender',    label: 'Kalender',    icon: CalendarIcon, color: '#B45070' },
  { href: '/uppgifter',   label: 'Uppgifter',   icon: CheckIcon,    color: '#9A7830' },
  { href: '/ekonomi',     label: 'Ekonomi',     icon: CoinsIcon,    color: '#5A9A50' },
  { href: '/arkiv',       label: 'Arkiv',       icon: FolderIcon,   color: '#907060' },
  { href: '/mat',         label: 'Mat & Hälsa', icon: LeafIcon,     color: '#6AA860' },
  { href: '/aktiviteter', label: 'Aktiviteter', icon: ActivityIcon, color: '#6AA860' },
  { href: '/studera',     label: 'Studera',     icon: BookIcon,     color: '#4A8CB4' },
  { href: '/paddan',      label: 'Paddan',      icon: HeartIcon,    color: '#3A8878' },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function Navigation() {
  const path = usePathname()
  const router = useRouter()
  const [showMore, setShowMore] = useState(false)

  if (path === '/onboarding' || path === '/') return null

  const merActive = merDrawer.some(item => path.startsWith(item.href))

  function handleDrawerNav(href: string) {
    setShowMore(false)
    router.push(href)
  }

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col sticky top-0 h-screen w-60 flex-shrink-0 overflow-y-auto"
        style={{ background: '#FFFFFF', borderRight: '1px solid rgba(0,0,0,0.08)' }}>

        {/* Logo */}
        <div className="px-8 py-8" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="text-xl font-bold tracking-[0.15em]" style={{ color: '#1A2018' }}>ARKIV</div>
          <div className="text-xs font-medium mt-1" style={{ color: '#8A9888' }}>Familjens centrum</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-6 space-y-0.5 overflow-y-auto">
          <NavSection label="HUVUDMENY" />
          {section1.map(item => <SidebarItem key={item.href} item={item} path={path} />)}

          <NavSection label="FAMILJEN" />
          {section2.map(item => <SidebarItem key={item.href} item={item} path={path} />)}

          <NavSection label="ARKIV & MER" />
          {section3.map(item => <SidebarItem key={item.href} item={item} path={path} />)}
        </nav>
      </aside>

      {/* ── Mobile bottom bar ───────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(242,237,230,0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(28,26,23,0.10)',
          height: 72,
        }}>
        <div className="flex items-center justify-around h-full px-2">
          {mobileMain.map(item => {
            const active = path.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}
                className="flex flex-col items-center justify-center gap-1 flex-1 h-full"
                style={{ minWidth: 0 }}>
                <div className="flex items-center justify-center rounded-2xl transition-all"
                  style={{
                    background: active ? '#2D5A27' : 'transparent',
                    width: 44, height: 32,
                  }}>
                  {mobileNavIcon(item.label, active)}
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 600, lineHeight: 1,
                  color: active ? '#2D5A27' : '#9C9690',
                }}>
                  {item.label}
                </span>
              </Link>
            )
          })}

          {/* Mer button */}
          <button
            onClick={() => setShowMore(s => !s)}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full"
            style={{ minWidth: 0 }}>
            <div className="flex items-center justify-center rounded-2xl transition-all"
              style={{
                background: (merActive || showMore) ? '#2D5A27' : 'transparent',
                width: 44, height: 32,
              }}>
              {mobileNavIcon('Mer', merActive || showMore)}
            </div>
            <span style={{
              fontSize: 10, fontWeight: 600, lineHeight: 1,
              color: (merActive || showMore) ? '#2D5A27' : '#9C9690',
            }}>Mer</span>
          </button>
        </div>
      </nav>

      {/* ── Mer drawer ──────────────────────────────────────────────────── */}
      {showMore && (
        <>
          <div className="fixed inset-0 z-[60] md:hidden"
            onClick={() => setShowMore(false)}
            style={{ background: 'rgba(26,32,24,0.4)', backdropFilter: 'blur(4px)' }} />
          <div className="fixed left-0 right-0 z-[70] md:hidden"
            style={{
              bottom: 'calc(68px + env(safe-area-inset-bottom, 0px))',
              background: '#FFFFFF',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: '20px 20px 0 0',
              padding: '16px 16px 8px',
            }}>
            <div className="w-10 h-1 rounded-full mx-auto mb-4"
              style={{ background: 'rgba(0,0,0,0.12)' }} />
            <div className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3 px-2"
              style={{ color: '#8A9888' }}>Mer</div>
            <div className="grid grid-cols-2 gap-2">
              {merDrawer.map(item => {
                const active = path.startsWith(item.href)
                return (
                  <button key={item.href}
                    onClick={() => handleDrawerNav(item.href)}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all"
                    style={{
                      background: active ? `${item.color}12` : 'rgba(0,0,0,0.03)',
                      border: active ? `1px solid ${item.color}30` : '1px solid rgba(0,0,0,0.07)',
                    }}>
                    {item.icon(active)}
                    <span className="text-sm font-semibold"
                      style={{ color: active ? item.color : '#5A6858' }}>
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </>
  )
}

// ── Sidebar helpers ───────────────────────────────────────────────────────────

function NavSection({ label }: { label: string }) {
  return (
    <div className="px-4 pt-5 pb-1.5 first:pt-1">
      <span className="text-[10px] font-semibold tracking-[0.2em] uppercase"
        style={{ color: '#8A9888' }}>{label}</span>
    </div>
  )
}

function SidebarItem({ item, path }: { item: NavEntry; path: string }) {
  const active = path.startsWith(item.href)
  return (
    <Link href={item.href}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-150"
      style={{
        background: active ? `${item.color}12` : 'transparent',
        color: active ? item.color : '#5A6858',
      }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: active ? `${item.color}18` : 'transparent' }}>
        {item.icon(active)}
      </div>
      <span className="text-sm font-semibold">{item.label}</span>
    </Link>
  )
}

// ── SVG Icons ────────────────────────────────────────────────────────────────

function icon(active: boolean, activeColor: string, children: React.ReactNode) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={active ? activeColor : '#8A9888'} strokeWidth={active ? 2.2 : 1.8}
      strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

function HomeIcon(active: boolean) {
  return icon(active, '#6450B4', <>
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </>)
}
function CardIcon(active: boolean) {
  return icon(active, '#C46040', <>
    <rect x="2" y="5" width="20" height="14" rx="2"/>
    <line x1="2" y1="10" x2="22" y2="10"/>
    <line x1="6" y1="15" x2="9" y2="15"/>
  </>)
}
function CoinsIcon(active: boolean) {
  return icon(active, '#5A9A50', <>
    <rect x="1" y="4" width="22" height="16" rx="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </>)
}
function MailIcon(active: boolean) {
  return icon(active, '#4A8CB4', <>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </>)
}
function CalendarIcon(active: boolean) {
  return icon(active, '#B45070', <>
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </>)
}
function CheckIcon(active: boolean) {
  return icon(active, '#9A7830', <>
    <polyline points="9 11 12 14 22 4"/>
    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
  </>)
}
function LeafIcon(active: boolean) {
  return icon(active, '#6AA860', <>
    <path d="M12 2a5 5 0 015 5c0 3-2 5-5 7-3-2-5-4-5-7a5 5 0 015-5z"/>
    <path d="M12 22V14"/>
  </>)
}
function FolderIcon(active: boolean) {
  return icon(active, '#907060', <>
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
  </>)
}
function BarChartIcon(active: boolean) {
  return icon(active, '#6450B4', <>
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </>)
}
function ActivityIcon(active: boolean) {
  return icon(active, '#6AA860', <>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </>)
}
function BookIcon(active: boolean) {
  return icon(active, '#4A8CB4', <>
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
  </>)
}
function HeartIcon(active: boolean) {
  return icon(active, '#3A8878', <>
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </>)
}
function DotsIcon(active: boolean) {
  return icon(active, '#907060', <>
    <circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>
  </>)
}

// ── Mobile nav icons (22px, white when active on forest pill) ─────────────────

function mobileNavIcon(label: string, active: boolean) {
  const stroke = active ? 'white' : '#9C9690'
  const sw = active ? 2.2 : 1.8
  const paths: Record<string, React.ReactNode> = {
    'Hem': <>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </>,
    'Räkningar': <>
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <line x1="2" y1="10" x2="22" y2="10"/>
      <line x1="6" y1="15" x2="9" y2="15"/>
    </>,
    'Mail': <>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </>,
    'Projekt': <>
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </>,
    'Mer': <>
      <circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>
    </>,
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {paths[label] ?? null}
    </svg>
  )
}
