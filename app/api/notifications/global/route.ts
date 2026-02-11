import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const notifications = await prisma.notification.findMany({
      where: {
        isActive: true,
        isGlobal: true,
        OR: [
          { targetUserId: null },
          { targetUserId: auth.userId },
        ],
        AND: [
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    return NextResponse.json({ notifications })
  } catch (error: any) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}
