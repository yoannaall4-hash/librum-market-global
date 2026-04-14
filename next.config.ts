import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  images: {
    domains: ['images.unsplash.com', 'www.librum.bg'],
  },
}

export default withNextIntl(nextConfig)
