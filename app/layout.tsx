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
        Flex row: sidebar | main
        On mobile the sidebar is hidden and bottom nav takes over.
        The sidebar uses sticky+h-screen so it stays visible while scrolling
        and participates in the flex layout (no z-index / stacking-context issues).
      */}
      <body className="flex min-h-screen bg-[#0D0D1A]">
        <BloomToast />
        <Navigation />
        <main className="flex-1 min-w-0 pb-[72px] md:pb-6 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
