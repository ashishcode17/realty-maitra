import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, requireAdminOrDirector } from '@/lib/middleware'
import { updateSponsorAndRecomputePaths } from '@/lib/tree'
import { createAuditLog, getClientIp } from '@/lib/audit'
import { writeUserLedgerEvent } from '@/lib/userLedger'

/** GET: Admin get single user (with sponsor info) */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    const { id } = await context.params
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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    const { id } = await context.params
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
      const nonActiveStatuses = ['DEACTIVATED', 'INACTIVE', 'SUSPENDED']
      const wasStatusChange = status !== undefined
      let snapshotForLedger: { name: string; email: string; phone: string | null; city: string | null; rank: string; role: string; treeId: string | null; profilePhotoUrl: string | null; idImageUrl: string | null } | null = null
      if (wasStatusChange) {
        const u = await prisma.user.findUnique({
          where: { id },
          select: { name: true, email: true, phone: true, city: true, rank: true, role: true, treeId: true, profilePhotoUrl: true, idImageUrl: true },
        })
        if (u) snapshotForLedger = u
      }
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
      if (wasStatusChange && snapshotForLedger) {
        const eventType = nonActiveStatuses.includes(status) ? 'DEACTIVATED' : (status === 'ACTIVE' ? 'REACTIVATED' : null)
        if (eventType) {
          await writeUserLedgerEvent({
            userId: id,
            eventType,
            snapshot: {
              name: snapshotForLedger.name,
              email: snapshotForLedger.email,
              phone: snapshotForLedger.phone,
              city: snapshotForLedger.city,
              rank: snapshotForLedger.rank,
              role: snapshotForLedger.role,
              treeId: snapshotForLedger.treeId,
              profileImageUrl: snapshotForLedger.profilePhotoUrl,
              govtIdImageUrl: snapshotForLedger.idImageUrl,
            },
            performedBy: admin.userId,
          }).catch((err) => console.error('Ledger write error:', err))
        }
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

/** DELETE: Admin/Director permanently delete user so they can re-register (removes from DB and related data). */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminOrDirector(request)
    if (auth instanceof NextResponse) return auth

    const { id } = await context.params
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const downlineCount = await prisma.user.count({ where: { sponsorId: id } })
    if (downlineCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete: this user has downline members. Reassign their sponsor first or remove them.' },
        { status: 400 }
      )
    }

    const otpIdentifier = user.email.startsWith('pending_')
      ? user.email.replace(/^pending_/, '')
      : user.email

    await prisma.$transaction(async (tx) => {
      await tx.govIdStorage.deleteMany({ where: { userId: id } })
      await tx.otpVerification.deleteMany({
        where: { identifier: otpIdentifier, purpose: 'REGISTER' },
      })
      // Tables that reference User without onDelete Cascade – delete or nullify first
      await tx.payoutLedger.deleteMany({ where: { userId: id } })
      await tx.earnings.deleteMany({ where: { userId: id } })
      await tx.trainingBooking.deleteMany({ where: { userId: id } })
      await tx.challengeEnrollment.deleteMany({ where: { userId: id } })
      await tx.auditLog.deleteMany({ where: { actorUserId: id } })
      await tx.notification.updateMany({ where: { targetUserId: id }, data: { targetUserId: null } })
      await tx.notification.updateMany({ where: { createdById: id }, data: { createdById: null } })
      await tx.lead.updateMany({ where: { assignedToUserId: id }, data: { assignedToUserId: null } })
      await tx.project.updateMany({ where: { createdById: id }, data: { createdById: null } })
      await tx.user.delete({ where: { id } })
    })

    await createAuditLog({
      actorUserId: auth.userId,
      action: 'USER_DELETED',
      entityType: 'User',
      entityId: id,
      metaJson: { deletedEmail: user.email, deletedName: user.name },
      ip: getClientIp(request),
    }).catch(() => {})

    return NextResponse.json({ ok: true, message: 'User deleted. They can register again.' })
  } catch (error: unknown) {
    console.error('Admin delete user error:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
