import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const category = searchParams.get('category') || ''
    const condition = searchParams.get('condition') || ''
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined
    const sort = searchParams.get('sort') || 'newest'
    const page = parseInt(searchParams.get('page') || '1')
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

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          seller: { select: { id: true, name: true, sellerType: true, country: true } },
          authors: { include: { author: true } },
          category: true,
        },
      }),
      prisma.book.count({ where }),
    ])

    return NextResponse.json({ books, total, page, pages: Math.ceil(total / perPage) })
  } catch (err) {
    console.error('[books] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await request.json()
    const { title, description, price, condition, categoryId, publisherId, authors, year, pages, isbn, stock, images } = data

    if (!title || !description || !price || !condition) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    }

    const book = await prisma.book.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        condition,
        categoryId: categoryId || null,
        publisherId: publisherId || null,
        year: year ? parseInt(year) : null,
        pages: pages ? parseInt(pages) : null,
        isbn: isbn || null,
        stock: stock ? parseInt(stock) : 1,
        images: JSON.stringify(images || []),
        sellerId: user.id,
        status: 'pending_approval',
      },
    })

    if (authors && Array.isArray(authors) && authors.length > 0) {
      for (const authorName of authors) {
        const trimmed = authorName.trim()
        if (!trimmed) continue
        const author = await prisma.author.upsert({
          where: { name: trimmed },
          update: {},
          create: { name: trimmed },
        })
        await prisma.bookAuthor.create({ data: { bookId: book.id, authorId: author.id } })
      }
    }

    return NextResponse.json({ success: true, book })
  } catch (err) {
    console.error('[books POST] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
