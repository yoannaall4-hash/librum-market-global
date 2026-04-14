import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Librum Market Global — Books for Europe',
  description: 'European marketplace for books. Buy and sell books across Europe.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900">{children}</body>
    </html>
  )
}
