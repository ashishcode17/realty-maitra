import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { getSubtreeUsers } from '@/lib/tree'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    // Get network size (subtree only)
    const subtreeIds = await getSubtreeUsers(auth.userId)
    const networkSize = subtreeIds.length

    // Get earnings
    const earnings = await prisma.earnings.findMany({
      where: { userId: auth.userId },
    })

    const totalEarnings = earnings
      .filter((e) => e.status === 'PAID' || e.status === 'APPROVED')
      .reduce((sum, e) => sum + e.totalAmount, 0)

    const pendingEarnings = earnings
      .filter((e) => e.status === 'PENDING')
      .reduce((sum, e) => sum + e.totalAmount, 0)

    // Get active challenges
    const activeChallenges = await prisma.challengeEnrollment.count({
      where: {
        userId: auth.userId,
        status: 'ACTIVE',
      },
    })

    // Get upcoming trainings
    const upcomingTrainings = await prisma.trainingBooking.count({
      where: {
        userId: auth.userId,
        status: 'CONFIRMED',
        session: {
          startDate: {
            gte: new Date(),
          },
        },
      },
    })

    return NextResponse.json({
      stats: {
        networkSize,
        totalEarnings,
        pendingEarnings,
        activeChallenges,
        upcomingTrainings,
      },
    })
  } catch (error: any) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
