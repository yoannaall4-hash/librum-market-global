import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

function createPrismaClient() {
  let url = process.env.DATABASE_URL ?? 'file:dev.db'
  // Vercel serverless requires https:// not libsql://
  if (url.startsWith('libsql://')) {
    url = url.replace('libsql://', 'https://')
  }
  const authToken = process.env.DATABASE_AUTH_TOKEN
  const adapter = new PrismaLibSql({ url, authToken })
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
