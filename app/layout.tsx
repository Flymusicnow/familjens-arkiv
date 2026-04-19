import type { Metadata } from 'next'
import { Lora, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import BloomToast from '@/components/Bloom'

const lora = Lora({ subsets: ['latin'], style: ['normal', 'italic'], weight: ['400', '500', '600'] })
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700', '800'] })

export const metadata: Metadata = {
  title: 'Familjens Arkiv',
  description: 'Familjens digitala hem — räkningar, dokument, uppgifter och kalender',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body className={`${jakarta.className} ${lora.className}`}>
        <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
          <BloomToast />
          <div className="flex min-h-screen">
            <Navigation />
            <main className="flex-1 min-w-0 overflow-x-hidden pb-24 md:pb-8" style={{ background: 'var(--bg-page)' }}>
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}
