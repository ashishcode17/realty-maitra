import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const challenges = await prisma.offerChallenge.findMany({
      where: {
        isActive: true,
        endDate: { gte: new Date() },
      },
      include: {
        enrollments: {
          include: {
            user: {
              select: {
                name: true,
                role: true,
                city: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ challenges })
  } catch (error: any) {
    console.error('Get challenges error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    )
  }
}
