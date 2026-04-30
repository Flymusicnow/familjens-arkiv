export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 w-full px-4 pt-6 pb-28 md:px-6 md:pt-8 md:pb-12 lg:px-8 xl:px-12 xl:pt-10">
      {children}
    </div>
  )
}
