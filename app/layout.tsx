import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/Navigation'
import BloomToast from '@/components/Bloom'

export const metadata: Metadata = {
  title: 'Familjens Arkiv',
  description: 'Familjens digitala hem — räkningar, dokument, uppgifter och kalender',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body className="antialiased" style={{ background: '#0A0A0A', color: '#F0F0F5', fontFamily: "'Lexend', system-ui, sans-serif" }}>
        <BloomToast />
        <Navigation />
        {/* w-60 = 240px matches sidebar width */}
        <main className="md:ml-60 w-full md:w-[calc(100%-240px)] overflow-x-hidden min-h-screen pb-24 md:pb-8">
          {children}
        </main>
      </body>
    </html>
  )
}
