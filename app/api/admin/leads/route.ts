import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware'
import { createAuditLog, getClientIp } from '@/lib/audit'

/** GET: Admin list all leads (with optional filters) */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const assignedTo = searchParams.get('assignedTo') || undefined

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (assignedTo) where.assignedToUserId = assignedTo

    const leads = await prisma.lead.findMany({
      where,
      include: {
        project: { select: { name: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    })

    return NextResponse.json({ leads })
  } catch (error: unknown) {
    console.error('Admin leads list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}

/** POST: Admin create lead (optional assignment) */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    let body: {
      name: string
      phone: string
      email?: string
      city?: string
      projectInterestId?: string
      source?: string
      status?: string
      notes?: string
      assignedToUserId?: string
    }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    if (!body.name || !body.phone) {
      return NextResponse.json(
        { error: 'name and phone are required' },
        { status: 400 }
      )
    }

    const lead = await prisma.lead.create({
      data: {
        name: body.name,
        phone: body.phone,
        email: body.email ?? null,
        city: body.city ?? null,
        projectInterestId: body.projectInterestId ?? null,
        source: body.source ?? null,
        status: (body.status as any) || 'NEW',
        notes: body.notes ?? null,
        assignedToUserId: body.assignedToUserId ?? null,
      },
    })

    await createAuditLog({
      actorUserId: admin.userId,
      action: 'LEAD_ASSIGN',
      entityType: 'Lead',
      entityId: lead.id,
      metaJson: {
        after: {
          name: lead.name,
          assignedToUserId: lead.assignedToUserId,
          status: lead.status,
        },
      },
      ip: getClientIp(request),
    })

    return NextResponse.json({ lead })
  } catch (error: unknown) {
    console.error('Admin create lead error:', error)
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    )
  }
}
