import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware'
import { updateSponsorAndRecomputePaths } from '@/lib/tree'
import { createAuditLog, getClientIp } from '@/lib/audit'

/** GET: Admin get single user (with sponsor info) */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    const { id } = await params
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        role: true,
        roleRank: true,
        status: true,
        sponsorId: true,
        path: true,
        sponsorCode: true,
        createdAt: true,
        sponsor: { select: { id: true, name: true, email: true } },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error: unknown) {
    console.error('Admin get user error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

/** PATCH: Admin update user (e.g. sponsor reassignment, role, status) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    const { id } = await params
    const body = await request.json()
    const { sponsorId, role, status } = body as {
      sponsorId?: string | null
      role?: string
      status?: string
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, sponsorId: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (role !== undefined) updateData.role = role
    if (status !== undefined) updateData.status = status

    if (sponsorId !== undefined) {
      const result = await updateSponsorAndRecomputePaths(id, sponsorId || null)
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }
      await createAuditLog({
        actorUserId: admin.userId,
        action: 'SPONSOR_REASSIGN',
        entityType: 'User',
        entityId: id,
        metaJson: { newSponsorId: sponsorId || null, previousSponsorId: existing.sponsorId },
        ip: getClientIp(request),
      })
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id },
        data: updateData,
      })
      if (role !== undefined || status !== undefined) {
        await createAuditLog({
          actorUserId: admin.userId,
          action: role !== undefined ? 'ROLE_CHANGE' : 'USER_STATUS_CHANGE',
          entityType: 'User',
          entityId: id,
          metaJson: { updates: updateData },
          ip: getClientIp(request),
        })
      }
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        sponsorId: true,
        sponsor: { select: { id: true, name: true } },
      },
    })
    return NextResponse.json({ user })
  } catch (error: unknown) {
    console.error('Admin update user error:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}
