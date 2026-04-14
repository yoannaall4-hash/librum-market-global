export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { getTranslations } from 'next-intl/server'

const COUNTRY_FLAGS: Record<string, string> = {
  BG: '🇧🇬', RO: '🇷🇴', GR: '🇬🇷', DE: '🇩🇪', FR: '🇫🇷',
  IT: '🇮🇹', ES: '🇪🇸', PL: '🇵🇱', NL: '🇳🇱', AT: '🇦🇹',
}

const CONDITION_LABELS: Record<string, Record<string, string>> = {
  en: { new: 'New', like_new: 'Like New', good: 'Good', acceptable: 'Acceptable' },
  ro: { new: 'Nou', like_new: 'Ca nou', good: 'Bun', acceptable: 'Acceptabil' },
}

export default async function BooksPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const { locale } = await params
  const sp = await searchParams
  const t = await getTranslations('books')

  const q = sp.q || ''
  const category = sp.category || ''
  const condition = sp.condition || ''
  const minPrice = sp.minPrice ? parseFloat(sp.minPrice) : undefined
  const maxPrice = sp.maxPrice ? parseFloat(sp.maxPrice) : undefined
  const sort = sp.sort || 'newest'
  const page = parseInt(sp.page || '1')
  const perPage = 20

  const where: Record<string, unknown> = { status: 'active' }
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { authors: { some: { author: { name: { contains: q } } } } },
    ]
  }
  if (category) where.category = { slug: category }
  if (condition) where.condition = condition
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {
      ...(minPrice !== undefined ? { gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
    }
  }

  const orderBy =
    sort === 'price_asc' ? { price: 'asc' as const } :
    sort === 'price_desc' ? { price: 'desc' as const } :
    sort === 'popular' ? { views: 'desc' as const } :
    { createdAt: 'desc' as const }

  const [books, total, categories] = await Promise.all([
    prisma.book.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        seller: { select: { id: true, name: true, country: true } },
        authors: { include: { author: true } },
        category: true,
      },
    }).catch(() => []),
    prisma.book.count({ where }).catch(() => 0),
    prisma.category.findMany({ orderBy: { name: 'asc' } }).catch(() => []),
  ])

  const totalPages = Math.ceil(total / perPage)
  const conditionLabels = CONDITION_LABELS[locale] || CONDITION_LABELS.en

  function buildUrl(overrides: Record<string, string | undefined>) {
    const merged: Record<string, string> = {}
    if (q) merged.q = q
    if (category) merged.category = category
    if (condition) merged.condition = condition
    if (minPrice !== undefined) merged.minPrice = String(minPrice)
    if (maxPrice !== undefined) merged.maxPrice = String(maxPrice)
    if (sort !== 'newest') merged.sort = sort
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === undefined || v === '') delete merged[k]
      else merged[k] = v
    })
    const qs = new URLSearchParams(merged).toString()
    return `/${locale}/books${qs ? '?' + qs : ''}`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{t('title')}</h1>
          <p className="text-sm text-stone-500 mt-1">{t('listings_count', { count: total })}</p>
        </div>
        <Link
          href={`/${locale}/books/new`}
          className="px-4 py-2 bg-amber-700 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
        >
          + {locale === 'ro' ? 'Adaugă carte' : 'Add Book'}
        </Link>
      </div>

      {/* Category pills — mobile */}
      <div className="-mx-4 px-4 mb-4 overflow-x-auto lg:hidden">
        <div className="flex gap-2 pb-2 whitespace-nowrap">
          <Link
            href={buildUrl({ category: undefined, page: undefined })}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${!category ? 'bg-amber-700 text-white border-amber-700' : 'bg-white text-stone-600 border-stone-200 hover:border-amber-400'}`}
          >
            {t('all_categories')}
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={buildUrl({ category: cat.slug, page: undefined })}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${category === cat.slug ? 'bg-amber-700 text-white border-amber-700' : 'bg-white text-stone-600 border-stone-200 hover:border-amber-400'}`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters — desktop */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="bg-white rounded-xl border border-stone-200 p-4 sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-stone-800 uppercase tracking-wide">{t('filters')}</h2>
              {(q || category || condition || minPrice || maxPrice) && (
                <Link href={`/${locale}/books`} className="text-xs text-red-500 hover:text-red-700">{t('clear')}</Link>
              )}
            </div>

            {/* Search */}
            <form action={`/${locale}/books`} method="get" className="mb-4">
              <label className="text-xs font-medium text-stone-600 uppercase tracking-wide">{t('search_filter')}</label>
              <div className="flex gap-1 mt-1">
                <input
                  name="q"
                  defaultValue={q}
                  placeholder={t('search_filter_placeholder')}
                  className="flex-1 text-sm rounded-lg border border-stone-200 px-2 py-1.5 focus:outline-none focus:border-amber-500"
                />
                <button type="submit" className="px-2 py-1.5 bg-amber-700 text-white rounded-lg text-sm hover:bg-amber-600">→</button>
              </div>
            </form>

            {/* Category */}
            <div className="mb-4">
              <label className="text-xs font-medium text-stone-600 uppercase tracking-wide">{t('category')}</label>
              <div className="mt-2 space-y-1">
                <Link href={buildUrl({ category: undefined, page: undefined })} className={`block text-sm py-1 px-2 rounded-lg transition-colors ${!category ? 'bg-amber-50 text-amber-800 font-medium' : 'text-stone-600 hover:bg-stone-50'}`}>
                  {t('all_categories')}
                </Link>
                {categories.map((cat) => (
                  <Link key={cat.id} href={buildUrl({ category: cat.slug, page: undefined })} className={`block text-sm py-1 px-2 rounded-lg transition-colors ${category === cat.slug ? 'bg-amber-50 text-amber-800 font-medium' : 'text-stone-600 hover:bg-stone-50'}`}>
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Condition */}
            <div className="mb-4">
              <label className="text-xs font-medium text-stone-600 uppercase tracking-wide">{t('condition')}</label>
              <div className="mt-2 space-y-1">
                {['', 'new', 'like_new', 'good', 'acceptable'].map((c) => (
                  <Link key={c} href={buildUrl({ condition: c || undefined, page: undefined })} className={`block text-sm py-1 px-2 rounded-lg transition-colors ${condition === c ? 'bg-amber-50 text-amber-800 font-medium' : 'text-stone-600 hover:bg-stone-50'}`}>
                    {c ? conditionLabels[c] : t('all_categories')}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Books grid */}
        <div className="flex-1 min-w-0">
          {/* Sort bar */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-stone-500 hidden sm:block">{total} {locale === 'ro' ? 'rezultate' : 'results'}</p>
            <div className="flex items-center gap-2 text-sm">
              {[
                { val: 'newest', label: t('sort_newest') },
                { val: 'price_asc', label: t('sort_price_asc') },
                { val: 'price_desc', label: t('sort_price_desc') },
                { val: 'popular', label: t('sort_popular') },
              ].map((s) => (
                <Link key={s.val} href={buildUrl({ sort: s.val, page: undefined })} className={`px-3 py-1.5 rounded-lg border transition-colors ${sort === s.val ? 'bg-amber-700 text-white border-amber-700' : 'text-stone-600 border-stone-200 hover:border-amber-400'}`}>
                  {s.label}
                </Link>
              ))}
            </div>
          </div>

          {books.length === 0 ? (
            <div className="text-center py-20 text-stone-400">
              <p className="text-lg font-medium">{t('no_results')}</p>
              <p className="text-sm mt-2">{t('try_filters')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {books.map((book) => {
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
                        {book.isFeatured && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 bg-amber-700 text-white text-xs font-medium rounded-full">⭐</span>
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
                          <span className="font-bold text-amber-800 text-sm">€{priceEur}</span>
                          {flag && <span className="text-base">{flag}</span>}
                        </div>
                        <p className="text-xs text-stone-400 mt-0.5">{conditionLabels[book.condition] || book.condition}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  {page > 1 && (
                    <Link href={buildUrl({ page: String(page - 1) })} className="px-4 py-2 border border-stone-200 rounded-lg text-sm hover:border-amber-400 transition-colors">
                      ←
                    </Link>
                  )}
                  <span className="text-sm text-stone-500">{t('page', { page, total: totalPages })}</span>
                  {page < totalPages && (
                    <Link href={buildUrl({ page: String(page + 1) })} className="px-4 py-2 border border-stone-200 rounded-lg text-sm hover:border-amber-400 transition-colors">
                      →
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
