import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const projects = await prisma.project.findMany({
      where: {
        status: {
          in: ['ACTIVE', 'UPCOMING'],
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ projects })
  } catch (error: any) {
    console.error('Get projects error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}
