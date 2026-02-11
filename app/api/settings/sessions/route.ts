import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const sessions = await prisma.userSession.findMany({
      where: { userId: auth.userId },
      orderBy: { lastActive: 'desc' },
      take: 20,
    })

    const list = sessions.map((s) => ({
      id: s.id,
      deviceInfo: s.deviceInfo || 'Unknown device',
      lastActive: s.lastActive,
      createdAt: s.createdAt,
    }))

    return NextResponse.json({ sessions: list })
  } catch (error: any) {
    console.error('Get sessions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}
