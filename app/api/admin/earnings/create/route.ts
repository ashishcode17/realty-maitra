import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware'
import { calculateAndCreateEarnings } from '@/lib/earnings'

/**
 * POST /api/admin/earnings/create
 * Body: { userId, projectId, baseAmount, bookingId?, notes? }
 * Creates earnings for the agent and uplines using the earnings calculation service.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    const body = await request.json()
    const { userId, projectId, baseAmount, bookingId, notes } = body as {
      userId: string
      projectId: string
      baseAmount: number
      bookingId?: string | null
      notes?: string | null
    }

    if (!userId || !projectId || typeof baseAmount !== 'number' || baseAmount <= 0) {
      return NextResponse.json(
        { error: 'userId, projectId, and positive baseAmount are required' },
        { status: 400 }
      )
    }

    const created = await calculateAndCreateEarnings({
      userId,
      projectId,
      baseAmount,
      bookingId: bookingId ?? null,
      notes: notes ?? null,
      approvedBy: admin.userId,
    })

    return NextResponse.json({
      message: 'Earnings created',
      count: created.length,
      earnings: created,
    })
  } catch (error: unknown) {
    console.error('Admin create earnings error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create earnings' },
      { status: 500 }
    )
  }
}
