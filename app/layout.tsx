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
        <div style={{ minHeight: '100vh', position: 'relative' }}>
          {/* Fixed full-bleed background */}
          <div style={{
            position: 'fixed', inset: 0, zIndex: -1,
            backgroundImage: 'url("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=90&auto=format")',
            backgroundSize: 'cover',
            backgroundPosition: 'center 40%',
            backgroundRepeat: 'no-repeat',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(160deg, rgba(5,10,20,0.50) 0%, rgba(0,5,15,0.65) 100%)',
            }} />
          </div>

          <BloomToast />
          <div className="flex min-h-screen">
            <Navigation />
            <main className="flex-1 min-w-0 overflow-x-hidden pb-24 md:pb-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}
