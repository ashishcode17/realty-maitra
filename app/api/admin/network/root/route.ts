import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware'

/** GET: Admin get platform root user (for "Entire network" tree). Returns the top-level user (no sponsor). */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    let root = await prisma.user.findFirst({
      where: { sponsorId: null },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true },
    })
    if (!root) {
      root = await prisma.user.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { id: true, name: true },
      })
    }
    if (!root) {
      return NextResponse.json({ error: 'No users found' }, { status: 404 })
    }

    return NextResponse.json({
      rootId: root.id,
      rootName: root.name ?? 'Platform root',
    })
  } catch (error: unknown) {
    console.error('Admin network root error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch platform root' },
      { status: 500 }
    )
  }
}
