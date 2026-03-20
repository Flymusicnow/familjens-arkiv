export default function KalenderPage() {
  return (
    <div className="page-in max-w-xl mx-auto px-4 pt-14 pb-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-100px] right-[-80px] w-96 h-96 rounded-full opacity-10"
          style={{ background: '#38B6FF', filter: 'blur(80px)' }} />
      </div>
      <div className="relative z-10 space-y-5">
        <div>
          <div className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: '#555570' }}>Schema</div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#F2F2FF', letterSpacing: '-0.5px' }}>Kalender</h1>
          <p className="text-sm mt-1" style={{ color: '#9898B8' }}>Google Kalender-sync — kommer i vecka 2</p>
        </div>
        <div className="rounded-2xl p-8 text-center" style={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="text-5xl mb-4">📅</div>
          <div className="font-bold mb-1" style={{ color: '#F2F2FF' }}>Veckokalender</div>
          <div className="text-sm" style={{ color: '#9898B8' }}>
            Synkronisering med Google Kalender för hela familjen byggs under vecka 2.
            Du kan redan skapa händelser via Supabase.
          </div>
        </div>
      </div>
    </div>
  )
}
