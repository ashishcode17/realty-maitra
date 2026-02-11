import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { tokenVersion: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const tokenVersion = (user as { tokenVersion?: number }).tokenVersion ?? 0

    await prisma.$transaction([
      prisma.user.update({
        where: { id: auth.userId },
        data: { tokenVersion: tokenVersion + 1 },
      }),
      prisma.userSession.deleteMany({ where: { userId: auth.userId } }),
    ])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Logout all error:', error)
    return NextResponse.json(
      { error: 'Failed to log out from all devices' },
      { status: 500 }
    )
  }
}
