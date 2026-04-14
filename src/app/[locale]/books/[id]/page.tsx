export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getTranslations } from 'next-intl/server'

const CONDITION_LABELS: Record<string, Record<string, string>> = {
  en: { new: 'New', like_new: 'Like New', good: 'Good', acceptable: 'Acceptable' },
  ro: { new: 'Nou', like_new: 'Ca nou', good: 'Bun', acceptable: 'Acceptabil' },
}

const COUNTRY_FLAGS: Record<string, string> = {
  BG: '🇧🇬', RO: '🇷🇴', GR: '🇬🇷', DE: '🇩🇪', FR: '🇫🇷',
  IT: '🇮🇹', ES: '🇪🇸', PL: '🇵🇱', NL: '🇳🇱', AT: '🇦🇹',
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const t = await getTranslations('book')

  const [book, session] = await Promise.all([
    prisma.book.findUnique({
      where: { id },
      include: {
        seller: { select: { id: true, name: true, sellerType: true, bio: true, country: true, createdAt: true } },
        authors: { include: { author: true } },
        category: true,
        publisher: true,
      },
    }).catch(() => null),
    getSession().catch(() => null),
  ])

  if (!book || book.status !== 'active') notFound()

  // Increment views
  prisma.book.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {})

  // Seller stats
  const [listingCount, ratingsData] = await Promise.all([
    prisma.book.count({ where: { sellerId: book.sellerId, status: 'active' } }).catch(() => 0),
    prisma.rating.findMany({ where: { ratedId: book.sellerId }, select: { score: true } }).catch(() => []),
  ])
  const avgRating = ratingsData.length
    ? (ratingsData.reduce((s: number, r: { score: number }) => s + r.score, 0) / ratingsData.length).toFixed(1)
    : null

  const images = (() => { try { return JSON.parse(book.images) } catch { return [] } })()
  const priceEur = (book.price * 1.15).toFixed(2)
  const conditionLabels = CONDITION_LABELS[locale] || CONDITION_LABELS.en
  const flag = COUNTRY_FLAGS[book.seller.country || ''] || ''
  const isOwner = session?.id === book.sellerId

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="text-sm text-stone-500 mb-6 flex items-center gap-2">
        <Link href={`/${locale}/books`} className="hover:text-stone-700">{locale === 'ro' ? 'Cărți' : 'Books'}</Link>
        {book.category && (
          <>
            <span>/</span>
            <Link href={`/${locale}/books?category=${book.category.slug}`} className="hover:text-stone-700">{book.category.name}</Link>
          </>
        )}
        <span>/</span>
        <span className="text-stone-900 font-medium truncate max-w-xs">{book.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Images */}
        <div className="lg:col-span-2">
          <div className="aspect-[3/4] bg-stone-100 rounded-2xl overflow-hidden relative">
            {images[0] ? (
              <Image src={images[0]} alt={book.title} fill className="object-cover" priority />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-6xl text-stone-300">📚</div>
            )}
            {book.isFeatured && (
              <div className="absolute top-3 left-3 px-3 py-1 bg-amber-700 text-white text-xs font-semibold rounded-full">
                {t('featured_badge')}
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto">
              {images.slice(1).map((img: string, i: number) => (
                <div key={i} className="w-16 h-20 shrink-0 bg-stone-100 rounded-lg overflow-hidden relative">
                  <Image src={img} alt={`${book.title} ${i + 2}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="lg:col-span-3">
          {book.category && (
            <Link href={`/${locale}/books?category=${book.category.slug}`} className="text-xs font-semibold uppercase tracking-widest text-amber-700 hover:text-amber-600 mb-2 inline-block">
              {book.category.name}
            </Link>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-2 leading-tight">{book.title}</h1>

          {book.authors.length > 0 && (
            <p className="text-stone-500 mb-4">
              {t('author')}: <span className="text-stone-700 font-medium">{book.authors.map(a => a.author.name).join(', ')}</span>
            </p>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-4xl font-bold text-stone-900">€{priceEur}</span>
            <span className="text-lg text-stone-400 font-medium">/ {book.price.toFixed(2)} лв.</span>
          </div>

          {/* Condition & category */}
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="px-3 py-1 bg-stone-100 text-stone-700 text-sm rounded-full font-medium">
              {conditionLabels[book.condition] || book.condition}
            </span>
            {book.language && (
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full font-medium uppercase">
                {book.language}
              </span>
            )}
            {book.stock > 0 ? (
              <span className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full font-medium">In Stock</span>
            ) : (
              <span className="px-3 py-1 bg-red-50 text-red-700 text-sm rounded-full font-medium">Out of Stock</span>
            )}
          </div>

          {/* Description */}
          {book.description && (
            <div className="mb-6">
              <p className="text-stone-700 leading-relaxed text-sm whitespace-pre-line">{book.description}</p>
            </div>
          )}

          {/* Book metadata */}
          <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
            {book.publisher && (
              <div>
                <span className="text-stone-500">{t('publisher')}: </span>
                <span className="text-stone-800 font-medium">{book.publisher.name}</span>
              </div>
            )}
            {book.year && (
              <div>
                <span className="text-stone-500">{t('year')}: </span>
                <span className="text-stone-800 font-medium">{book.year}</span>
              </div>
            )}
            {book.pages && (
              <div>
                <span className="text-stone-500">{t('pages')}: </span>
                <span className="text-stone-800 font-medium">{book.pages}</span>
              </div>
            )}
            {book.isbn && (
              <div>
                <span className="text-stone-500">{t('isbn')}: </span>
                <span className="text-stone-800 font-medium">{book.isbn}</span>
              </div>
            )}
          </div>

          {/* Protected deal notice */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-stone-600">
              <span className="font-semibold text-stone-800">{t('protected_deal')}</span>{' '}
              {t('protected_deal')}
            </p>
          </div>

          {/* CTA buttons */}
          {!isOwner ? (
            <div className="flex gap-3">
              {session ? (
                <>
                  <button className="flex-1 py-3.5 bg-amber-700 text-white font-semibold rounded-xl hover:bg-amber-600 transition-colors">
                    {t('buy')}
                  </button>
                  <button className="px-6 py-3.5 border border-stone-300 text-stone-700 font-semibold rounded-xl hover:border-stone-400 transition-colors">
                    {t('message')}
                  </button>
                </>
              ) : (
                <Link href={`/${locale}/login`} className="flex-1 py-3.5 bg-amber-700 text-white font-semibold rounded-xl hover:bg-amber-600 transition-colors text-center">
                  {locale === 'ro' ? 'Conectați-vă pentru a cumpăra' : 'Sign in to buy'}
                </Link>
              )}
            </div>
          ) : (
            <div className="flex gap-3">
              <Link href={`/${locale}/books/${id}/edit`} className="flex-1 py-3.5 border border-stone-300 text-stone-700 font-semibold rounded-xl hover:border-stone-400 transition-colors text-center">
                {t('edit')}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Seller info */}
      <div className="mt-10 bg-white rounded-2xl border border-stone-200 p-6">
        <h2 className="text-base font-bold text-stone-900 mb-4 uppercase tracking-wide">{t('seller_title')}</h2>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-700 flex items-center justify-center font-bold text-white text-lg shrink-0">
            {book.seller.name[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-stone-900">{book.seller.name}</p>
              {flag && <span>{flag}</span>}
            </div>
            {avgRating && (
              <div className="flex items-center gap-1 text-sm text-amber-600 mb-1">
                <span>★</span>
                <span>{avgRating}</span>
                <span className="text-stone-400">({ratingsData.length} {t('reviews')})</span>
              </div>
            )}
            <p className="text-sm text-stone-500">
              {t('listings_count', { count: listingCount })} •{' '}
              {t('member_since')} {new Date(book.seller.createdAt).getFullYear()}
            </p>
            {book.seller.bio && <p className="text-sm text-stone-600 mt-2">{book.seller.bio}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
