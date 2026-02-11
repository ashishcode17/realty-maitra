import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const sessions = await prisma.trainingSession.findMany({
      where: {
        isActive: true,
        startDate: { gte: new Date() },
      },
      orderBy: { startDate: 'asc' },
      include: {
        slots: {
          orderBy: { startTime: 'asc' },
          include: {
            bookings: {
              where: { status: 'CONFIRMED' },
              select: { id: true },
            },
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
      slots: s.slots.map((slot) => ({
        id: slot.id,
        title: slot.title,
        startTime: slot.startTime,
        endTime: slot.endTime,
        capacity: slot.capacity,
        bookedCount: slot.bookings.length,
        available: Math.max(0, slot.capacity - slot.bookings.length),
      })),
    }))

    return NextResponse.json({ sessions: formatted })
  } catch (error: any) {
    console.error('Get training sessions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch training sessions' },
      { status: 500 }
    )
  }
}
