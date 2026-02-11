import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware'

/**
 * GET /api/admin/analytics?period=30
 * Returns analytics for admin dashboard: users over time, earnings over time, counts, recent activity.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    const { searchParams } = new URL(request.url)
    const periodDays = Math.min(Math.max(parseInt(searchParams.get('period') || '30', 10), 7), 365)
    const since = new Date()
    since.setDate(since.getDate() - periodDays)
    since.setHours(0, 0, 0, 0)

    const [
      totalUsers,
      totalProjects,
      totalEarningsSum,
      pendingEarningsSum,
      usersCreatedSince,
      earningsSince,
      earningsByMonth,
      recentUsers,
      recentEarnings,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.earnings.aggregate({
        where: { status: { in: ['APPROVED', 'PAID'] } },
        _sum: { totalAmount: true },
      }),
      prisma.earnings.aggregate({
        where: { status: 'PENDING' },
        _sum: { totalAmount: true },
      }),
      prisma.user.count({ where: { createdAt: { gte: since } } }),
      prisma.earnings.findMany({
        where: { createdAt: { gte: since } },
        select: { totalAmount: true, status: true, createdAt: true },
      }),
      prisma.$queryRaw<
        { month: string; total: number; count: number }[]
      >`
        SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') as month,
               SUM("totalAmount")::float as total,
               COUNT(*)::int as count
        FROM "Earnings"
        WHERE "createdAt" >= ${since}
        GROUP BY date_trunc('month', "createdAt")
        ORDER BY month ASC
      `.catch(() => []),
      prisma.user.findMany({
        where: { createdAt: { gte: since } },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.earnings.findMany({
        where: { createdAt: { gte: since } },
        include: { project: { select: { name: true } }, user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { actor: { select: { name: true } } },
      }),
    ])

    const earningsTotalInPeriod = earningsSince.reduce((s, e) => s + e.totalAmount, 0)
    const earningsByStatus = {
      PENDING: earningsSince.filter((e) => e.status === 'PENDING').reduce((s, e) => s + e.totalAmount, 0),
      APPROVED: earningsSince.filter((e) => e.status === 'APPROVED').reduce((s, e) => s + e.totalAmount, 0),
      PAID: earningsSince.filter((e) => e.status === 'PAID').reduce((s, e) => s + e.totalAmount, 0),
    }

    return NextResponse.json({
      analytics: {
        periodDays,
        since: since.toISOString(),
        totals: {
          users: totalUsers,
          projects: totalProjects,
          earningsApprovedOrPaid: totalEarningsSum._sum.totalAmount ?? 0,
          earningsPending: pendingEarningsSum._sum.totalAmount ?? 0,
        },
        inPeriod: {
          usersCreated: usersCreatedSince,
          earningsTotal: earningsTotalInPeriod,
          earningsByStatus,
        },
        earningsByMonth: Array.isArray(earningsByMonth) ? earningsByMonth : [],
        recentUsers,
        recentEarnings,
        recentAuditLogs: recentAuditLogs.map((l) => ({
          id: l.id,
          action: l.action,
          entityType: l.entityType,
          entityId: l.entityId,
          actorName: (l.actor as { name: string | null })?.name ?? null,
          createdAt: l.createdAt,
        })),
      },
    })
  } catch (error: unknown) {
    console.error('Admin analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
