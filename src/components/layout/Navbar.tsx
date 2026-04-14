'use client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Button from '@/components/ui/Button'

interface NavUser {
  id: string
  name: string
  role: string
}

export default function Navbar() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<NavUser | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.user) setUser(data.user) })
      .catch(() => {})
  }, [])

  async function handleLogout() {
    await fetch('/api/auth', { method: 'POST', body: JSON.stringify({ action: 'logout' }), headers: { 'Content-Type': 'application/json' } })
    setUser(null)
    router.push(`/${locale}`)
    router.refresh()
  }

  function switchLocale(newLocale: string) {
    // Replace current locale prefix in pathname
    const withoutLocale = pathname.replace(/^\/(en|ro)/, '') || '/'
    router.push(`/${newLocale}${withoutLocale}`)
  }

  return (
    <nav className="bg-stone-900 text-stone-100 shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center group shrink-0">
            <span className="font-bold text-white text-xl tracking-widest group-hover:text-stone-200 transition-colors">
              LIBRUM
            </span>
            <span className="font-light text-stone-400 text-xl tracking-wide ml-1.5 group-hover:text-stone-300 transition-colors">
              Global
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link href={`/${locale}/books`} className="px-3 py-1.5 text-sm text-stone-300 hover:text-white hover:bg-stone-800 rounded-lg transition-colors">
              {t('books')}
            </Link>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2">
            {/* Locale switcher */}
            <div className="flex items-center gap-1 border border-stone-700 rounded-lg px-1 py-0.5">
              <button
                onClick={() => switchLocale('en')}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${locale === 'en' ? 'bg-amber-700 text-white' : 'text-stone-400 hover:text-white'}`}
              >
                EN
              </button>
              <button
                onClick={() => switchLocale('ro')}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${locale === 'ro' ? 'bg-amber-700 text-white' : 'text-stone-400 hover:text-white'}`}
              >
                RO
              </button>
            </div>

            {/* BG site link */}
            <a
              href="https://librum.bg"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-stone-600 text-stone-400 hover:border-amber-500 hover:text-amber-400 transition-colors text-xs font-medium"
            >
              🇧🇬 BG
            </a>

            {user ? (
              <>
                <Link href={`/${locale}/books/new`} className="hidden md:block">
                  <Button size="sm" variant="outline" className="border-amber-500 text-amber-400 hover:bg-amber-900/40">
                    {t('addListing')}
                  </Button>
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-amber-700 flex items-center justify-center font-bold text-white text-xs">
                      {user.name[0].toUpperCase()}
                    </div>
                    <span className="hidden md:block">{user.name}</span>
                    <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-stone-100 z-20 py-1.5 overflow-hidden">
                        <div className="px-4 py-2 border-b border-stone-100 mb-1">
                          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Account</p>
                        </div>
                        <Link href={`/${locale}/dashboard`} onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">
                          <span>📊</span> {t('dashboard')}
                        </Link>
                        <Link href={`/${locale}/dashboard/listings`} onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">
                          <span>📚</span> {t('listings')}
                        </Link>
                        <Link href={`/${locale}/profile`} onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">
                          <span>👤</span> {t('profile')}
                        </Link>
                        {user.role === 'admin' && (
                          <>
                            <div className="border-t border-stone-100 my-1" />
                            <Link href={`/${locale}/admin`} onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-amber-700 hover:bg-amber-50 font-medium">
                              <span>⚙️</span> {t('admin')}
                            </Link>
                          </>
                        )}
                        <div className="border-t border-stone-100 my-1" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <span>→</span> {t('logout')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href={`/${locale}/login`}>
                  <Button size="sm" variant="ghost" className="text-stone-300 hover:text-white hover:bg-stone-800">
                    {t('login')}
                  </Button>
                </Link>
                <Link href={`/${locale}/register`}>
                  <Button size="sm" variant="primary">
                    {t('register')}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
