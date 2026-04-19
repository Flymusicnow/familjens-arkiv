export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 pt-8 pb-32 md:px-10 md:pb-12">
      {children}
    </div>
  )
}
