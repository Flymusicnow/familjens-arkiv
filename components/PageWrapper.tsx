export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen px-5 pt-6 pb-28 md:pb-14">
      {children}
    </div>
  )
}
