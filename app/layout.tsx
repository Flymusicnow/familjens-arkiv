import type { Metadata } from 'next'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import BloomToast from '@/components/Bloom'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Familjens Arkiv',
  description: 'Familjens digitala hem — räkningar, dokument, uppgifter och kalender',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" className={`${dmSans.variable} ${playfair.variable}`}>
      <body className={`antialiased ${dmSans.className}`} style={{ background: '#FAF8F5', color: '#1A2018' }}>
        <BloomToast />
        <div className="flex min-h-screen">
          <Navigation />
          <main className="flex-1 min-w-0 overflow-x-hidden pb-24 md:pb-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
