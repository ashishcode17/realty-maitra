import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware'

/** GET: Admin list all users (for dropdowns, view-as, etc.) */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '500', 10), 500)

    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { email: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        city: true,
        status: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
      take: limit,
    })

    return NextResponse.json({ users })
  } catch (error: unknown) {
    console.error('Admin users list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
