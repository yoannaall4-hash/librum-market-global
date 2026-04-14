import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword, generateToken } from '@/lib/auth'
import { cookies } from 'next/headers'

const SESSION_DURATION_DAYS = 30

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json()

    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    }

    if (action === 'register') {
      const { name, email, password, country } = data

      if (!name || !email || !password) {
        return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
      }

      const exists = await prisma.user.findUnique({ where: { email } })
      if (exists) {
        return NextResponse.json({ error: 'Email is already registered' }, { status: 400 })
      }

      const hashedPassword = await hashPassword(password)
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'user',
          country: country || null,
        },
      })

      const token = generateToken()
      const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000)
      await prisma.session.create({ data: { userId: user.id, token, expiresAt } })

      const res = NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
      res.cookies.set('auth_token', token, { ...cookieOpts, expires: expiresAt })
      return res
    }

    if (action === 'login') {
      const { email, password } = data
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
      }

      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      }

      if (user.isBanned) {
        return NextResponse.json({ error: 'Account is banned' }, { status: 403 })
      }

      const valid = await verifyPassword(password, user.password)
      if (!valid) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      }

      const token = generateToken()
      const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000)
      await prisma.session.create({ data: { userId: user.id, token, expiresAt } })

      const res = NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
      res.cookies.set('auth_token', token, { ...cookieOpts, expires: expiresAt })
      return res
    }

    if (action === 'logout') {
      const cookieStore = await cookies()
      const token = cookieStore.get('auth_token')?.value
      if (token) {
        await prisma.session.deleteMany({ where: { token } }).catch(() => {})
      }
      const res = NextResponse.json({ success: true })
      res.cookies.set('auth_token', '', { ...cookieOpts, expires: new Date(0) })
      return res
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('[auth] error:', err)
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}
