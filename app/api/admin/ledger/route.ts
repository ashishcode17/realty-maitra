import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminOrDirector } from '@/lib/middleware'

/**
 * GET /api/admin/ledger
 * Admin/Director only. List UserLedger with filters: eventType, treeId, dateFrom, dateTo, search (name/email/phone).
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminOrDirector(request)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const eventType = searchParams.get('eventType') ?? undefined
    const treeId = searchParams.get('treeId') ?? undefined
    const dateFrom = searchParams.get('dateFrom') ?? undefined
    const dateTo = searchParams.get('dateTo') ?? undefined
    const search = searchParams.get('search')?.trim() ?? undefined
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 500)

    const where: Record<string, unknown> = {}
    if (eventType) where.eventType = eventType
    if (treeId) where.treeId = treeId
    if (dateFrom || dateTo) {
      where.timestamp = {}
      if (dateFrom) (where.timestamp as Record<string, Date>).gte = new Date(dateFrom)
      if (dateTo) (where.timestamp as Record<string, Date>).lte = new Date(dateTo)
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    const rows = await prisma.userLedger.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
    })

    return NextResponse.json({ ledger: rows })
  } catch (e: unknown) {
    console.error('Ledger list error:', e)
    return NextResponse.json({ error: 'Failed to fetch ledger' }, { status: 500 })
  }
}
