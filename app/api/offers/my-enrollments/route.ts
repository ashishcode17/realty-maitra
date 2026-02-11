import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const enrollments = await prisma.challengeEnrollment.findMany({
      where: { userId: auth.userId },
      include: {
        challenge: true,
      },
      orderBy: { enrolledAt: 'desc' },
    })

    return NextResponse.json({ enrollments })
  } catch (error: any) {
    console.error('Get enrollments error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch enrollments' },
      { status: 500 }
    )
  }
}
