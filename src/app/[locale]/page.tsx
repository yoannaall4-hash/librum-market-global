export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { getTranslations } from 'next-intl/server'

async function getRecentBooks() {
  return prisma.book.findMany({
    where: { status: 'active' },
    take: 8,
    include: {
      seller: { select: { id: true, name: true, country: true } },
      authors: { include: { author: true } },
      category: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

async function getStats() {
  const [books, users] = await Promise.all([
    prisma.book.count({ where: { status: 'active' } }),
    prisma.user.count(),
  ])
  return { books, users }
}

async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: 'asc' } })
}

const CATEGORY_ICONS: Record<string, string> = {
  archaeology: '🏺',
  theology: '📖',
  children: '🧒',
  encyclopedias: '📚',
  health: '🌿',
  economics: '📈',
  history: '🏛',
  music: '🎵',
  pedagogy: '🎓',
  law: '⚖️',
  psychology: '🧠',
  'exact-sciences': '🔬',
  tourism: '🗺️',
  textbooks: '📝',
  philosophy: '💭',
  fiction: '✍️',
}

const COUNTRY_FLAGS: Record<string, string> = {
  BG: '🇧🇬', RO: '🇷🇴', GR: '🇬🇷', DE: '🇩🇪', FR: '🇫🇷',
  IT: '🇮🇹', ES: '🇪🇸', PL: '🇵🇱', NL: '🇳🇱', AT: '🇦🇹',
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('home')

  const [recent, stats, categories] = await Promise.all([
    getRecentBooks().catch(() => []),
    getStats().catch(() => ({ books: 0, users: 0 })),
    getCategories().catch(() => []),
  ])

  return (
    <div>
      {/* Hero */}
      <section className="bg-stone-900 text-white py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-[0.3em] text-amber-500 mb-4 uppercase">
            {t('hero_label')}
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 tracking-tight">
            {t('hero_title')}
          </h1>
          <p className="text-stone-400 text-lg italic mb-2">{t('hero_quote')}</p>
          <p className="text-stone-600 text-sm mb-10">{t('hero_source')}</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href={`/${locale}/books`}
              className="px-8 py-3.5 bg-amber-700 text-white rounded-xl font-semibold text-base hover:bg-amber-600 transition-colors"
            >
              {t('browse')}
            </Link>
            <Link
              href={`/${locale}/books/new`}
              className="px-8 py-3.5 border border-stone-600 text-stone-300 rounded-xl font-semibold text-base hover:border-amber-600 hover:text-amber-400 transition-colors"
            >
              {t('sell')}
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 sm:gap-16 text-center">
            <div>
              <p className="text-2xl font-bold text-white">{stats.books}+</p>
              <p className="text-xs text-stone-500 uppercase tracking-widest mt-1">{t('listings')}</p>
            </div>
            <div className="w-px h-8 bg-stone-800" />
            <div>
              <p className="text-2xl font-bold text-white">{stats.users}+</p>
              <p className="text-xs text-stone-500 uppercase tracking-widest mt-1">{t('readers')}</p>
            </div>
            <div className="w-px h-8 bg-stone-800" />
            <div>
              <p className="text-2xl font-bold text-amber-500">10%</p>
              <p className="text-xs text-stone-500 uppercase tracking-widest mt-1">{t('commission')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-lg font-bold text-stone-800 mb-6 uppercase tracking-widest">{t('categories')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/${locale}/books?category=${cat.slug}`}
                className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-stone-200 hover:border-amber-400 hover:shadow-md transition-all group"
              >
                <span className="text-2xl mb-2">{CATEGORY_ICONS[cat.slug] || '📚'}</span>
                <span className="text-xs font-medium text-stone-700 text-center group-hover:text-amber-800 leading-tight">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent Books */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-stone-800 uppercase tracking-widest">{t('recent')}</h2>
          <Link href={`/${locale}/books`} className="text-sm text-amber-700 hover:text-amber-600 font-medium">
            {t('viewAll')}
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <p className="text-lg font-medium">{t('noBooks')}</p>
            <Link href={`/${locale}/books/new`} className="mt-4 inline-block text-amber-700 hover:text-amber-600 font-medium">
              {t('beFirst')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {recent.map((book) => {
              const images = (() => { try { return JSON.parse(book.images) } catch { return [] } })()
              const priceEur = (book.price * 1.15).toFixed(2)
              const flag = COUNTRY_FLAGS[book.seller.country || ''] || ''
              return (
                <Link
                  key={book.id}
                  href={`/${locale}/books/${book.id}`}
                  className="group bg-white rounded-xl overflow-hidden border border-stone-200 hover:border-amber-300 hover:shadow-lg transition-all"
                >
                  <div className="aspect-[3/4] bg-stone-100 relative overflow-hidden">
                    {images[0] ? (
                      <Image src={images[0]} alt={book.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-4xl text-stone-300">📚</div>
                    )}
                    {book.condition === 'new' && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-amber-700 text-white text-xs font-medium rounded-full">New</span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-stone-900 line-clamp-2 group-hover:text-amber-800 leading-tight mb-1">
                      {book.title}
                    </h3>
                    {book.authors.length > 0 && (
                      <p className="text-xs text-stone-500 mb-2 truncate">
                        {book.authors.map(a => a.author.name).join(', ')}
                      </p>
                    )}
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="font-bold text-amber-800 text-sm">€{priceEur}</span>
                      </div>
                      {flag && <span className="text-base">{flag}</span>}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="bg-stone-900 text-white py-16 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold uppercase tracking-widest text-center mb-10">{t('how_title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '01', title: t('step1_title'), desc: t('step1_desc') },
              { num: '02', title: t('step2_title'), desc: t('step2_desc') },
              { num: '03', title: t('step3_title'), desc: t('step3_desc') },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-12 h-12 rounded-full border border-amber-700 flex items-center justify-center text-amber-500 font-bold mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-stone-400 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
