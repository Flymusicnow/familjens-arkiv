export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 pt-5 pb-28 md:px-8 md:pt-8 md:pb-12 max-w-2xl mx-auto"
      style={{ position: 'relative', zIndex: 1 }}>
      {children}
    </div>
  )
}
