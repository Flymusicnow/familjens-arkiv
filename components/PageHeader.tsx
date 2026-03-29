export function PageHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string
  title: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        {eyebrow && (
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-2"
            style={{ color: 'rgba(255,255,255,0.3)' }}>
            {eyebrow}
          </p>
        )}
        <h1 className="text-4xl font-black" style={{ color: '#F2F2FF', letterSpacing: '-1.5px' }}>
          {title}
        </h1>
      </div>
      {action}
    </div>
  )
}
