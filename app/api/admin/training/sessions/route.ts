import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware'

/** GET: Admin list all training sessions (including past/inactive) with slots and booking counts */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    const sessions = await prisma.trainingSession.findMany({
      orderBy: { startDate: 'desc' },
      include: {
        slots: {
          orderBy: { startTime: 'asc' },
          include: {
            _count: { select: { bookings: true } },
          },
        },
      },
    })

    const formatted = sessions.map((s) => ({
      id: s.id,
      title: s.title,
      mode: s.mode,
      location: s.location,
      meetingLink: s.meetingLink,
      description: s.description,
      startDate: s.startDate,
      endDate: s.endDate,
      slotCapacity: s.slotCapacity,
      isActive: s.isActive,
      createdById: s.createdById,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      slots: s.slots.map((slot) => ({
        id: slot.id,
        title: slot.title,
        startTime: slot.startTime,
        endTime: slot.endTime,
        capacity: slot.capacity,
        bookedCount: slot._count.bookings,
        available: Math.max(0, slot.capacity - slot._count.bookings),
      })),
    }))

    return NextResponse.json({ sessions: formatted })
  } catch (error: unknown) {
    console.error('Admin training sessions list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

/** POST: Admin create training session with slots */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    const body = await request.json()
    const {
      title,
      mode,
      location,
      meetingLink,
      description,
      startDate,
      endDate,
      slotCapacity = 50,
      slots,
    } = body as {
      title: string
      mode: string
      location?: string
      meetingLink?: string
      description?: string
      startDate: string
      endDate?: string
      slotCapacity?: number
      slots?: Array<{
        title?: string
        startTime: string
        endTime: string
        capacity?: number
      }>
    }

    if (!title || !mode || !startDate) {
      return NextResponse.json(
        { error: 'title, mode, and startDate are required' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : null

    const session = await prisma.trainingSession.create({
      data: {
        title,
        mode: mode as 'ONLINE' | 'OFFLINE',
        location: location ?? null,
        meetingLink: meetingLink ?? null,
        description: description ?? null,
        startDate: start,
        endDate: end,
        slotCapacity: slotCapacity ?? 50,
        createdById: admin.userId,
      },
    })

    if (Array.isArray(slots) && slots.length > 0) {
      await prisma.trainingSlot.createMany({
        data: slots.map((slot) => ({
          sessionId: session.id,
          title: slot.title ?? null,
          startTime: new Date(slot.startTime),
          endTime: new Date(slot.endTime),
          capacity: slot.capacity ?? 20,
        })),
      })
    }

    const withSlots = await prisma.trainingSession.findUnique({
      where: { id: session.id },
      include: {
        slots: { orderBy: { startTime: 'asc' } },
      },
    })

    return NextResponse.json({ session: withSlots ?? session })
  } catch (error: unknown) {
    console.error('Admin create training session error:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}
