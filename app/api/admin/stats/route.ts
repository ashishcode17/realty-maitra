import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth

    const [totalUsers, totalProjects, activeChallenges, trainingSessions] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.offerChallenge.count({ where: { isActive: true } }),
      prisma.trainingSession.count({ where: { isActive: true } }),
    ])

    return NextResponse.json({
      stats: {
        totalUsers,
        totalProjects,
        activeChallenges,
        trainingSessions,
      },
    })
  } catch (error: any) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    )
  }
}
