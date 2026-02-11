import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware'
import { createAuditLog, getClientIp } from '@/lib/audit'

/** PATCH: Admin assign lead or update any field */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    const { id } = await params
    let body: {
      assignedToUserId?: string | null
      status?: string
      notes?: string
      nextFollowUpAt?: string | null
    }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const lead = await prisma.lead.findUnique({
      where: { id },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const previousAssign = lead.assignedToUserId
    const previousStatus = lead.status

    const data: Record<string, unknown> = {}
    if (body.assignedToUserId !== undefined) data.assignedToUserId = body.assignedToUserId
    if (body.status !== undefined) data.status = body.status
    if (body.notes !== undefined) data.notes = body.notes
    if (body.nextFollowUpAt !== undefined) {
      data.nextFollowUpAt = body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : null
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: data as any,
    })

    if (body.assignedToUserId !== undefined && body.assignedToUserId !== previousAssign) {
      await createAuditLog({
        actorUserId: admin.userId,
        action: 'LEAD_ASSIGN',
        entityType: 'Lead',
        entityId: id,
        metaJson: {
          before: { assignedToUserId: previousAssign },
          after: { assignedToUserId: updated.assignedToUserId },
        },
        ip: getClientIp(request),
      })
    }
    if (body.status !== undefined && body.status !== previousStatus) {
      await createAuditLog({
        actorUserId: admin.userId,
        action: 'LEAD_STAGE_CHANGE',
        entityType: 'Lead',
        entityId: id,
        metaJson: {
          before: { status: previousStatus },
          after: { status: updated.status },
        },
        ip: getClientIp(request),
      })
    }

    return NextResponse.json({ lead: updated })
  } catch (error: unknown) {
    console.error('Admin lead update error:', error)
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    )
  }
}
