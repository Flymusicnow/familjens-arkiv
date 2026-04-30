export function PageWrapper({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div
      className={`px-4 pt-6 pb-28 md:px-8 md:pt-8 md:pb-12 lg:px-10 xl:px-12 xl:pt-10 mx-auto ${wide ? 'max-w-6xl' : 'max-w-4xl'}`}
      style={{ position: 'relative', zIndex: 1 }}
    >
      {children}
    </div>
  )
}
