import { PageWrapper } from '@/components/PageWrapper'
import { PageHeader } from '@/components/PageHeader'

export default function KalenderPage() {
  return (
    <PageWrapper>
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-100px] right-[-80px] w-96 h-96 rounded-full opacity-10"
          style={{ background: '#38B6FF', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10 max-w-xl mx-auto">
        <PageHeader eyebrow="Schema" title="Kalender" />

        <div className="rounded-3xl p-8 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-6xl mb-4">📅</div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: '#F2F2FF' }}>Kommer snart</h2>
          <p className="text-base leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Google Kalender-synk för hela familjen. Du kan redan skapa händelser via Supabase.
          </p>
          <div className="rounded-2xl p-4"
            style={{ background: 'rgba(123,110,255,0.1)', border: '1px solid rgba(123,110,255,0.2)' }}>
            <p className="text-sm font-semibold" style={{ color: '#9D93FF' }}>
              🚀 Lanseras vecka 2
            </p>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
