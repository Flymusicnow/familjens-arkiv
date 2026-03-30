export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 pt-6 pb-28 md:px-8 md:pb-8">
      {children}
    </div>
  )
}
