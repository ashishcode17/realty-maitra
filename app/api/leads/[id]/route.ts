import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { createAuditLog, getClientIp } from '@/lib/audit'

/** PATCH: Update lead stage/notes (only assigned agent) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    let body: { status?: string; notes?: string; nextFollowUpAt?: string }
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

    if (lead.assignedToUserId !== auth.userId) {
      return NextResponse.json({ error: 'Not authorized to update this lead' }, { status: 403 })
    }

    const previousStatus = lead.status
    const updates: Record<string, unknown> = {}
    if (body.status) updates.status = body.status
    if (body.notes !== undefined) updates.notes = body.notes
    if (body.nextFollowUpAt !== undefined) {
      updates.nextFollowUpAt = body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : null
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: updates as any,
    })

    if (body.status && body.status !== previousStatus) {
      await createAuditLog({
        actorUserId: auth.userId,
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
    console.error('Lead update error:', error)
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    )
  }
}
