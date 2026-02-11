import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const earnings = await prisma.earnings.findMany({
      where: { userId: auth.userId },
      include: {
        project: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ earnings })
  } catch (error: any) {
    console.error('Get income error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch income' },
      { status: 500 }
    )
  }
}
