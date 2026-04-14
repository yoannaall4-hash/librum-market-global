import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        seller: { select: { id: true, name: true, sellerType: true, bio: true, country: true, createdAt: true } },
        authors: { include: { author: true } },
        category: true,
        publisher: true,
      },
    })
    if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Increment view count
    prisma.book.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {})

    // Seller stats
    const [listingCount, ratingsData] = await Promise.all([
      prisma.book.count({ where: { sellerId: book.sellerId, status: 'active' } }),
      prisma.rating.findMany({ where: { ratedId: book.sellerId }, select: { score: true } }),
    ])
    const avgRating = ratingsData.length
      ? ratingsData.reduce((s, r) => s + r.score, 0) / ratingsData.length
      : null

    return NextResponse.json({ book, sellerStats: { listingCount, avgRating, ratingCount: ratingsData.length } })
  } catch (err) {
    console.error('[book GET] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
