import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('bg-BG', {
    style: 'currency',
    currency: 'BGN',
    minimumFractionDigits: 2,
  }).format(price)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('bg-BG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('bg-BG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export const COMMISSION_RATE = 0.1

export function calculateCommission(
  price: number,
  shippingCost = 0
): { commission: number; sellerPayout: number; total: number } {
  const commission = price * COMMISSION_RATE
  const sellerPayout = price - commission
  const total = price + shippingCost
  return { commission, sellerPayout, total }
}

export const CONDITIONS: Record<string, string> = {
  new: 'Нова',
  like_new: 'Като нова',
  good: 'Добро',
  acceptable: 'Задоволително',
}

export const CONDITION_DESCRIPTIONS: Record<string, string> = {
  new: 'Запечатана, непрегледана',
  like_new: 'Без следи от употреба',
  good: 'Минимални следи, пълна',
  acceptable: 'Видими следи, но четима',
}

export const PERIODS: Record<string, string> = {
  patristic: 'Патристика',
  medieval: 'Средновековие',
  modern: 'Ново време',
  contemporary: 'Съвременна',
}

export const SELLER_TYPES: Record<string, string> = {
  individual: 'Физическо лице',
  priest: 'Свещеник / Енория',
  monastery: 'Манастир',
  publisher: 'Издателство',
  antiquarian: 'Антиквариат',
}

export const ORDER_STATUSES: Record<string, string> = {
  pending: 'Очаква плащане',
  paid: 'Платена',
  shipped: 'Изпратена',
  delivered: 'Доставена',
  disputed: 'Оспорена',
  cancelled: 'Отменена',
  refunded: 'Възстановена',
}

export const BOOK_STATUSES: Record<string, string> = {
  pending_approval: 'Очаква одобрение',
  active: 'Активна',
  sold: 'Продадена',
  paused: 'На пауза',
  removed: 'Премахната',
}

export const COURIER_PRICES: Record<string, { name: string; price: number; days: string }> = {
  econt: { name: 'Еконт', price: 5.99, days: '1–2 работни дни' },
  speedy: { name: 'Спиди', price: 5.49, days: '1–3 работни дни' },
}

export const FEATURED_PLANS = [
  { id: 'listing_7', label: '7 дни изтъкнатост', price: 4.99, days: 7 },
  { id: 'listing_14', label: '14 дни изтъкнатост', price: 7.99, days: 14 },
  { id: 'listing_30', label: '30 дни изтъкнатост', price: 12.99, days: 30 },
]
