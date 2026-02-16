import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET: Public. Returns whether the app has any users (bootstrap status).
 * Used by registration page: hasUsers=false → show Create Root Admin; hasUsers=true → require invite code.
 * Count excludes pending users (email starting with pending_).
 */
export async function GET() {
  try {
    const count = await prisma.user.count({
      where: { email: { not: { startsWith: 'pending_' } } },
    })
    return NextResponse.json({ hasUsers: count > 0 })
  } catch (e) {
    console.error('Bootstrap status error:', e)
    return NextResponse.json({ hasUsers: true }, { status: 500 })
  }
}
