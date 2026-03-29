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
      {/*
        Fixed sidebar (w-64, z-40) + main with md:ml-64.
        On mobile the sidebar is hidden and bottom nav takes over.
      */}
      <body className="bg-[#0D0D1A] min-h-screen">
        <BloomToast />
        <Navigation />
        <main className="md:ml-64 min-h-screen pb-[72px] md:pb-0">
          {children}
        </main>
      </body>
    </html>
  )
}
