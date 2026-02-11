import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware'
import { createAuditLog, getClientIp } from '@/lib/audit'

/**
 * PATCH: Admin approves or rejects challenge completion.
 * Body: { status: "COMPLETED" | "FAILED", reason?: string }
 * Only admin can set COMPLETED; user cannot self-complete.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    const { id } = await params
    let body: { status?: string; reason?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const { status, reason } = body
    if (!status || !['COMPLETED', 'FAILED'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be COMPLETED or FAILED' },
        { status: 400 }
      )
    }

    const enrollment = await prisma.challengeEnrollment.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        challenge: { select: { title: true } },
      },
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    const previousStatus = enrollment.status

    await prisma.challengeEnrollment.update({
      where: { id },
      data: {
        status: status as 'COMPLETED' | 'FAILED',
        completedAt: status === 'COMPLETED' ? new Date() : null,
        approvedBy: admin.userId,
        notes: reason
          ? [enrollment.notes, reason].filter(Boolean).join('\n\n')
          : enrollment.notes,
        isVerified: status === 'COMPLETED',
      },
    })

    await createAuditLog({
      actorUserId: admin.userId,
      action: status === 'COMPLETED' ? 'CHALLENGE_COMPLETION_APPROVE' : 'CHALLENGE_COMPLETION_REJECT',
      entityType: 'ChallengeEnrollment',
      entityId: id,
      metaJson: {
        before: { status: previousStatus },
        after: { status, approvedBy: admin.userId },
        reason: reason || undefined,
        challengeTitle: enrollment.challenge?.title,
        userName: enrollment.user?.name,
      },
      ip: getClientIp(request),
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Admin challenge enrollment update error:', error)
    return NextResponse.json(
      { error: 'Failed to update enrollment' },
      { status: 500 }
    )
  }
}
