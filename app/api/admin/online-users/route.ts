import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminOrDirector } from '@/lib/middleware'

const ONLINE_THRESHOLD_MS = 90 * 1000 // 90 seconds

/**
 * GET /api/admin/online-users
 * Admin/Director only. Returns users sorted: online first (lastActive within 90s), then offline by lastActive desc.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminOrDirector(request)
    if (auth instanceof NextResponse) return auth

    const users = await prisma.user.findMany({
      where: { email: { not: { startsWith: 'pending_' } } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        rank: true,
        performanceRank: true,
        profilePhotoUrl: true,
        lastActive: true,
        treeId: true,
      },
      orderBy: { lastActive: 'desc' },
    })

    const now = Date.now()
    const withOnline = users.map((u) => ({
      ...u,
      isOnline: u.lastActive ? now - new Date(u.lastActive).getTime() < ONLINE_THRESHOLD_MS : false,
    }))
    withOnline.sort((a, b) => {
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1
      const aTime = a.lastActive ? new Date(a.lastActive).getTime() : 0
      const bTime = b.lastActive ? new Date(b.lastActive).getTime() : 0
      return bTime - aTime
    })

    return NextResponse.json({
      users: withOnline.map(({ isOnline, lastActive, ...rest }) => ({
        ...rest,
        isOnline,
        lastSeenAt: lastActive,
      })),
    })
  } catch (e: unknown) {
    console.error('Online users error:', e)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
