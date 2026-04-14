'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface Category { id: string; name: string; slug: string }
interface Publisher { id: string; name: string }

function resizeImage(file: File, maxPx = 1600, quality = 0.82): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxPx || height > maxPx) {
        if (width > height) { height = Math.round(height * maxPx / width); width = maxPx }
        else { width = Math.round(width * maxPx / height); height = maxPx }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Canvas error'))
        const reader = new FileReader()
        reader.onload = () => resolve({ base64: (reader.result as string).split(',')[1], mimeType: 'image/jpeg' })
        reader.readAsDataURL(blob)
      }, 'image/jpeg', quality)
    }
    img.onerror = reject
    img.src = url
  })
}

export default function NewBookPage() {
  const t = useTranslations('new_book')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const [authChecked, setAuthChecked] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [publishers, setPublishers] = useState<Publisher[]>([])
  const [newPublisher, setNewPublisher] = useState('')
  const [showAddPublisher, setShowAddPublisher] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [authors, setAuthors] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [publisherId, setPublisherId] = useState('')
  const [price, setPrice] = useState('')
  const [condition, setCondition] = useState('new')
  const [stock, setStock] = useState('1')
  const [year, setYear] = useState('')
  const [pages, setPages] = useState('')
  const [isbn, setIsbn] = useState('')
  const [images, setImages] = useState<string[]>([])

  const [scanning, setScanning] = useState(false)
  const [scanMsg, setScanMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/me').then(r => r.ok ? r.json() : null).then(data => {
      if (!data?.user) { router.push(`/${locale}/login`); return }
      setAuthChecked(true)
    }).catch(() => router.push(`/${locale}/login`))
    fetch('/api/categories').then(r => r.json()).then(d => setCategories(d.categories || []))
    fetch('/api/publishers').then(r => r.json()).then(d => setPublishers(d.publishers || []))
  }, [locale, router])

  async function handleScan() {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return
    setScanning(true)
    setScanMsg('')
    try {
      const { base64, mimeType } = await resizeImage(file)
      const res = await fetch('/api/scan-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType }),
      })
      const data = await res.json()
      if (!res.ok || !data.description) { setScanMsg('⚠️ Failed to read text. Try again.'); return }
      setDescription(data.description)
      setScanMsg(t('scan_success'))
    } catch { setScanMsg('⚠️ Error scanning image.') } finally { setScanning(false) }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    for (const file of files.slice(0, 5 - images.length)) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        if (ev.target?.result) setImages(prev => [...prev, ev.target!.result as string])
      }
      reader.readAsDataURL(file)
    }
  }

  async function handleAddPublisher() {
    if (!newPublisher.trim()) return
    const res = await fetch('/api/publishers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newPublisher.trim() }),
    })
    const data = await res.json()
    if (data.publisher) {
      setPublishers(prev => [...prev, data.publisher])
      setPublisherId(data.publisher.id)
      setNewPublisher('')
      setShowAddPublisher(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!title || !description || !price || !condition) {
      setError('Please fill in all required fields.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description, price, condition, stock, year, pages, isbn,
          categoryId: categoryId || null,
          publisherId: publisherId || null,
          authors: authors ? authors.split(',').map(a => a.trim()).filter(Boolean) : [],
          images,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error submitting listing.'); return }
      router.push(`/${locale}/books/${data.book.id}`)
    } catch { setError('Network error. Please try again.') } finally { setSubmitting(false) }
  }

  if (!authChecked) return null

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-stone-900 mb-2">{t('title')}</h1>
      <p className="text-stone-500 mb-8">{t('subtitle')}</p>

      {/* Back cover scanner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
        <h2 className="font-semibold text-amber-900 mb-1">{t('scan_title')}</h2>
        <p className="text-sm text-amber-700 mb-3">{t('scan_desc')}</p>
        <div className="flex items-center gap-3">
          <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={scanning}>
            {t('scan_btn')}
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleScan} />
          {scanning && <span className="text-sm text-amber-700 animate-pulse">{t('reading_text')}</span>}
          {scanMsg && !scanning && <span className="text-sm text-green-700">{scanMsg}</span>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Book photos */}
        <div>
          <label className="text-sm font-medium text-stone-700 block mb-2">Photos ({images.length}/5)</label>
          <div className="flex flex-wrap gap-2">
            {images.map((img, i) => (
              <div key={i} className="relative w-20 h-24 bg-stone-100 rounded-lg overflow-hidden">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))}
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600">×</button>
              </div>
            ))}
            {images.length < 5 && (
              <button type="button" onClick={() => imageInputRef.current?.click()}
                className="w-20 h-24 border-2 border-dashed border-stone-300 rounded-lg flex items-center justify-center text-stone-400 hover:border-amber-400 hover:text-amber-500 transition-colors text-2xl">
                +
              </button>
            )}
          </div>
          <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
        </div>

        <Input id="title" label={`${t('book_title')}`} value={title} onChange={e => setTitle(e.target.value)} required />

        <div className="flex flex-col gap-1">
          <label htmlFor="desc" className="text-sm font-medium text-stone-700">{t('description')} *</label>
          <textarea
            id="desc" value={description} onChange={e => setDescription(e.target.value)}
            rows={5} required
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600 resize-y"
          />
        </div>

        <Input id="authors" label={t('authors')} value={authors} onChange={e => setAuthors(e.target.value)} placeholder="e.g. Dostoevsky, Tolstoy" />

        {/* Category */}
        <div className="flex flex-col gap-1">
          <label htmlFor="cat" className="text-sm font-medium text-stone-700">{t('category')}</label>
          <select id="cat" value={categoryId} onChange={e => setCategoryId(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600">
            <option value="">— Select —</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Publisher */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-stone-700">{t('publisher')}</label>
          <div className="flex gap-2">
            <select value={publisherId} onChange={e => setPublisherId(e.target.value)}
              className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600">
              <option value="">— Select —</option>
              {publishers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button type="button" onClick={() => setShowAddPublisher(!showAddPublisher)}
              className="text-xs text-amber-700 hover:text-amber-600 font-medium whitespace-nowrap px-2">
              {showAddPublisher ? t('cancel_publisher') : t('add_publisher')}
            </button>
          </div>
          {showAddPublisher && (
            <div className="flex gap-2 mt-1">
              <input value={newPublisher} onChange={e => setNewPublisher(e.target.value)}
                placeholder={t('publisher_placeholder')}
                className="flex-1 text-sm rounded-lg border border-stone-200 px-3 py-2 focus:outline-none focus:border-amber-500" />
              <button type="button" onClick={handleAddPublisher}
                className="px-3 py-2 bg-amber-700 text-white text-sm rounded-lg hover:bg-amber-600">{t('add_publisher_btn')}</button>
            </div>
          )}
        </div>

        {/* Edition */}
        <div className="grid grid-cols-3 gap-3">
          <Input id="year" label={t('year')} type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="2020" />
          <Input id="pages" label={t('pages')} type="number" value={pages} onChange={e => setPages(e.target.value)} placeholder="320" />
          <Input id="isbn" label={t('isbn')} value={isbn} onChange={e => setIsbn(e.target.value)} placeholder="978-..." />
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-2 gap-3">
          <Input id="price" label={`${t('price')}`} type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} required placeholder="25.00" />
          <div className="flex flex-col gap-1">
            <label htmlFor="condition" className="text-sm font-medium text-stone-700">{t('condition')} *</label>
            <select id="condition" value={condition} onChange={e => setCondition(e.target.value)} required
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600">
              <option value="new">New</option>
              <option value="like_new">Like New</option>
              <option value="good">Good</option>
              <option value="acceptable">Acceptable</option>
            </select>
          </div>
        </div>
        <Input id="stock" label={t('stock')} type="number" min="1" value={stock} onChange={e => setStock(e.target.value)} />

        <p className="text-xs text-stone-500">{t('commission_note')}</p>
        <p className="text-xs text-amber-600">{t('approval_note')}</p>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={() => router.back()}>{t('cancel')}</Button>
          <Button type="submit" variant="primary" size="lg" loading={submitting} className="flex-1">{t('submit')}</Button>
        </div>
      </form>
    </div>
  )
}
