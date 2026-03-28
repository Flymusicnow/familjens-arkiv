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
      <body>
        <BloomToast />
        <Navigation />
        {/* Desktop: offset for 224px sidebar; mobile: offset for bottom nav */}
        <main className="md:ml-[220px] pb-24 md:pb-6 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
