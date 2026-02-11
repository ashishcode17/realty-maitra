import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware'

const PAGE_SIZE = 50

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const entityType = searchParams.get('entityType') || undefined
    const action = searchParams.get('action') || undefined
    const actorUserId = searchParams.get('actorUserId') || undefined

    const where: Record<string, unknown> = {}
    if (entityType) where.entityType = entityType
    if (action) where.action = action
    if (actorUserId) where.actorUserId = actorUserId

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.auditLog.count({ where }),
    ])

    return NextResponse.json({
      logs,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
    })
  } catch (error: unknown) {
    console.error('Admin audit list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit log' },
      { status: 500 }
    )
  }
}
