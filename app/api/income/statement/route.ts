import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

/**
 * GET /api/income/statement?month=YYYY-MM&format=json|csv
 * Returns earnings for the current user for the given month. format=csv returns CSV download.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const monthParam = searchParams.get('month')
    const format = searchParams.get('format') || 'json'

    const now = new Date()
    const year = monthParam ? parseInt(monthParam.slice(0, 4), 10) : now.getFullYear()
    const month = monthParam ? parseInt(monthParam.slice(5, 7), 10) : now.getMonth() + 1
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Invalid month; use YYYY-MM' },
        { status: 400 }
      )
    }

    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0, 23, 59, 59, 999)

    const earnings = await prisma.earnings.findMany({
      where: {
        userId: auth.userId,
        createdAt: { gte: start, lte: end },
      },
      include: {
        project: { select: { name: true, location: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    const totalAmount = earnings.reduce((sum, e) => sum + e.totalAmount, 0)
    const summary = {
      month: `${year}-${String(month).padStart(2, '0')}`,
      totalAmount,
      count: earnings.length,
      byStatus: {
        PENDING: earnings.filter((e) => e.status === 'PENDING').reduce((s, e) => s + e.totalAmount, 0),
        APPROVED: earnings.filter((e) => e.status === 'APPROVED').reduce((s, e) => s + e.totalAmount, 0),
        PAID: earnings.filter((e) => e.status === 'PAID').reduce((s, e) => s + e.totalAmount, 0),
      },
    }

    if (format === 'csv') {
      const header = 'Date,Project,Booking ID,Base Amount,Slab %,Calculated,Upline1,Upline2,Total,Status\n'
      const rows = earnings.map(
        (e) =>
          `${e.createdAt.toISOString().slice(0, 10)},${(e.project as { name: string }).name ?? ''},${e.bookingId ?? ''},${e.baseAmount},${e.slabPct},${e.calculatedAmount},${e.uplineBonus1},${e.uplineBonus2},${e.totalAmount},${e.status}`
      )
      const csv = header + rows.join('\n')
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="statement-${summary.month}.csv"`,
        },
      })
    }

    return NextResponse.json({
      statement: { summary, earnings },
    })
  } catch (error: unknown) {
    console.error('Income statement error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statement' },
      { status: 500 }
    )
  }
}
