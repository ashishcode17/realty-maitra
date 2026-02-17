import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

const THROTTLE_MS = 25_000 // Update at most once per 25s to avoid DB hammering

/**
 * POST /api/heartbeat
 * Authenticated only. Updates user's lastActive. Call periodically (e.g. every 30s) when tab is visible.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { lastActive: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const now = new Date()
    const last = user.lastActive ? new Date(user.lastActive).getTime() : 0
    if (now.getTime() - last < THROTTLE_MS) {
      return NextResponse.json({ ok: true })
    }
    await prisma.user.update({
      where: { id: auth.userId },
      data: { lastActive: now },
    })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    console.error('Heartbeat error:', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
