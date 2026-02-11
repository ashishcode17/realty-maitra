import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

/** GET: List leads assigned to the current user only */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined

    const where: { assignedToUserId: string; status?: string } = {
      assignedToUserId: auth.userId,
    }
    if (status) where.status = status

    const leads = await prisma.lead.findMany({
      where,
      include: {
        project: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ leads })
  } catch (error: unknown) {
    console.error('Leads list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}
