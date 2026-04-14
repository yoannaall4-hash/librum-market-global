import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { routing } from '../../../i18n/routing'
import Navbar from '@/components/layout/Navbar'
import { notFound } from 'next/navigation'

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'en' | 'ro')) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="bg-stone-900 text-stone-400 py-10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-baseline gap-1.5 mb-3">
                <span className="font-bold text-white text-lg tracking-widest">LIBRUM</span>
                <span className="font-light text-stone-400 text-lg">Global</span>
              </div>
              <p className="text-sm text-stone-500 leading-relaxed">
                {locale === 'ro'
                  ? 'Piață de carte pentru Europa. Conectând cititori, vânzători și cărți cu suflet.'
                  : 'Book marketplace for Europe. Connecting readers, sellers and books with soul.'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-300 uppercase tracking-wide mb-3">
                {locale === 'ro' ? 'Navigare' : 'Navigation'}
              </h3>
              <ul className="space-y-2 text-sm">
                <li><a href={`/${locale}/books`} className="hover:text-white transition-colors">{locale === 'ro' ? 'Toate cărțile' : 'All Books'}</a></li>
                <li><a href={`/${locale}/books/new`} className="hover:text-white transition-colors">{locale === 'ro' ? 'Vinde o carte' : 'Sell a Book'}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-300 uppercase tracking-wide mb-3">Contact</h3>
              <p className="text-sm">contact@librum.bg</p>
              <p className="text-xs text-stone-600 mt-1">
                {locale === 'ro' ? 'Răspundem în 24 ore.' : 'We respond within 24 hours.'}
              </p>
            </div>
          </div>
          <div className="border-t border-stone-800 pt-6 text-center text-xs text-stone-600">
            © {new Date().getFullYear()} Librum Market. {locale === 'ro' ? 'Toate drepturile rezervate.' : 'All rights reserved.'}
          </div>
        </div>
      </footer>
    </NextIntlClientProvider>
  )
}
