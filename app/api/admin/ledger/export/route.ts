import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminOrDirector } from '@/lib/middleware'

/**
 * GET /api/admin/ledger/export?eventType=&treeId=&dateFrom=&dateTo=&search=
 * Admin/Director only. Returns CSV of filtered ledger rows.
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
      take: 10000,
    })

    const headers = [
      'Date/Time',
      'Event',
      'Name',
      'Email',
      'Phone',
      'City',
      'State',
      'Rank',
      'Role',
      'TreeId',
      'InviterUserId',
      'InviterCode',
      'PerformedBy',
    ]
    const escape = (v: string | null | undefined) => {
      if (v == null) return ''
      const s = String(v)
      if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
      return s
    }
    const lines = [headers.join(',')]
    for (const r of rows) {
      lines.push(
        [
          r.timestamp.toISOString(),
          r.eventType,
          escape(r.name),
          escape(r.email),
          escape(r.phone),
          escape(r.city),
          escape(r.state),
          escape(r.rank),
          escape(r.role),
          escape(r.treeId),
          escape(r.inviterUserId),
          escape(r.inviterCode),
          escape(r.performedBy),
        ].join(',')
      )
    }
    const csv = lines.join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="user-ledger-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (e: unknown) {
    console.error('Ledger export error:', e)
    return NextResponse.json({ error: 'Failed to export ledger' }, { status: 500 })
  }
}
