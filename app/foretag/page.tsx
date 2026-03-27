export const dynamic = 'force-dynamic'

import Link from 'next/link'

export default function ForetagPage() {
  return (
    <div className="page-in max-w-xl mx-auto px-4 pt-14 pb-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-80px] right-[-60px] w-80 h-80 rounded-full opacity-10"
          style={{ background: '#7B6EFF', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10 space-y-6">
        <div>
          <div className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: '#555570' }}>
            Familjens
          </div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#F2F2FF', letterSpacing: '-0.5px' }}>
            Företag
          </h1>
        </div>

        <div className="rounded-2xl px-6 py-8 text-center space-y-4"
          style={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="text-5xl">🏢</div>
          <div className="font-bold text-lg" style={{ color: '#F2F2FF' }}>Kommer snart</div>
          <div className="text-sm" style={{ color: '#9898B8' }}>
            Företagsmodulen är under utveckling — här kommer fakturor, momsredovisning och bokföring.
          </div>
          <Link href="/projekt"
            className="inline-block mt-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white"
            style={{ background: '#7B6EFF' }}>
            Se Projekt istället →
          </Link>
        </div>
      </div>
    </div>
  )
}
