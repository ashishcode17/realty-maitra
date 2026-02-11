// Import Prisma Client - Next.js will handle TypeScript compilation
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // Load .env file if not already loaded (for Next.js)
  if (typeof window === 'undefined' && !process.env.DATABASE_URL) {
    try {
      require('dotenv').config()
    } catch (e) {
      // dotenv might not be available, that's okay
    }
  }
  
  if (!process.env.DATABASE_URL) {
    console.error('⚠️  DATABASE_URL is not set in environment variables')
    console.error('   Make sure .env file exists in project root')
    console.error('   And contains: DATABASE_URL="postgresql://..."')
    throw new Error('DATABASE_URL environment variable is required')
  }
  
  try {
    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
    
    return client
  } catch (error: any) {
    console.error('Failed to create Prisma client:', error)
    throw error
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
