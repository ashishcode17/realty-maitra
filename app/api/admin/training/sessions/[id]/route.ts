import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware'

/** GET: Admin get single session with slots and booking counts */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    const { id } = await context.params
    const session = await prisma.trainingSession.findUnique({
      where: { id },
      include: {
        slots: {
          orderBy: { startTime: 'asc' },
          include: { _count: { select: { bookings: true } } },
        },
      },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const formatted = {
      id: session.id,
      title: session.title,
      mode: session.mode,
      location: session.location,
      meetingLink: session.meetingLink,
      description: session.description,
      startDate: session.startDate,
      endDate: session.endDate,
      slotCapacity: session.slotCapacity,
      isActive: session.isActive,
      createdById: session.createdById,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      slots: session.slots.map((slot) => ({
        id: slot.id,
        title: slot.title,
        startTime: slot.startTime,
        endTime: slot.endTime,
        capacity: slot.capacity,
        bookedCount: slot._count.bookings,
        available: Math.max(0, slot.capacity - slot._count.bookings),
      })),
    }

    return NextResponse.json({ session: formatted })
  } catch (error: unknown) {
    console.error('Admin get session error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    )
  }
}

/** PATCH: Admin update session (and optionally replace slots) */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    const { id } = await context.params
    const body = await request.json()
    const {
      title,
      mode,
      location,
      meetingLink,
      description,
      startDate,
      endDate,
      slotCapacity,
      isActive,
      slots,
    } = body as {
      title?: string
      mode?: string
      location?: string
      meetingLink?: string
      description?: string
      startDate?: string
      endDate?: string
      slotCapacity?: number
      isActive?: boolean
      slots?: Array<{
        id?: string
        title?: string
        startTime: string
        endTime: string
        capacity?: number
      }>
    }

    const existing = await prisma.trainingSession.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (mode !== undefined) updateData.mode = mode
    if (location !== undefined) updateData.location = location
    if (meetingLink !== undefined) updateData.meetingLink = meetingLink
    if (description !== undefined) updateData.description = description
    if (startDate !== undefined) updateData.startDate = new Date(startDate)
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null
    if (slotCapacity !== undefined) updateData.slotCapacity = slotCapacity
    if (isActive !== undefined) updateData.isActive = isActive

    const session = await prisma.trainingSession.update({
      where: { id },
      data: updateData,
    })

    if (Array.isArray(slots)) {
      const existingSlots = await prisma.trainingSlot.findMany({
        where: { sessionId: id },
        select: { id: true },
      })
      const existingIds = new Set(existingSlots.map((s) => s.id))
      const slotIdsInBody = new Set(
        slots.map((s) => (s as { id?: string }).id).filter(Boolean)
      )
      const toDelete = existingSlots.filter((s) => !slotIdsInBody.has(s.id))
      if (toDelete.length > 0) {
        await prisma.trainingSlot.deleteMany({
          where: { id: { in: toDelete.map((s) => s.id) } },
        })
      }
      for (const slot of slots) {
        const slotId = (slot as { id?: string }).id
        if (slotId && existingIds.has(slotId)) {
          await prisma.trainingSlot.update({
            where: { id: slotId },
            data: {
              title: slot.title ?? null,
              startTime: new Date(slot.startTime),
              endTime: new Date(slot.endTime),
              capacity: slot.capacity ?? 20,
            },
          })
        } else {
          await prisma.trainingSlot.create({
            data: {
              sessionId: id,
              title: slot.title ?? null,
              startTime: new Date(slot.startTime),
              endTime: new Date(slot.endTime),
              capacity: slot.capacity ?? 20,
            },
          })
        }
      }
    }

    const withSlots = await prisma.trainingSession.findUnique({
      where: { id },
      include: { slots: { orderBy: { startTime: 'asc' } } },
    })

    return NextResponse.json({ session: withSlots ?? session })
  } catch (error: unknown) {
    console.error('Admin update session error:', error)
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    )
  }
}

/** DELETE: Admin delete session (cascade: slots, bookings) */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    const { id } = await context.params
    const existing = await prisma.trainingSession.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    await prisma.trainingSession.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Admin delete session error:', error)
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    )
  }
}
