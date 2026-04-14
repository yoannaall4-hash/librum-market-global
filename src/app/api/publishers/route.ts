import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const publishers = await prisma.publisher.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json({ publishers })
  } catch {
    return NextResponse.json({ publishers: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name } = await request.json()
    if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

    const publisher = await prisma.publisher.upsert({
      where: { name: name.trim() },
      update: {},
      create: { name: name.trim() },
    })
    return NextResponse.json({ publisher })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
