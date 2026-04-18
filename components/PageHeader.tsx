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
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-2"
            style={{ color: 'var(--t3)' }}>
            {eyebrow}
          </p>
        )}
        <h1 className="text-[32px] font-black leading-tight tracking-tight"
          style={{ color: '#1A2018' }}>
          {title}
        </h1>
      </div>
      {action}
    </div>
  )
}
