import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const { id: sessionId } = await context.params
    let body: any = null
    try {
      body = await request.json()
    } catch {
      body = {}
    }
    const slotId = body?.slotId as string | undefined

    if (!slotId) {
      return NextResponse.json({ error: 'slotId is required' }, { status: 400 })
    }

    // Check session and slot
    const session = await prisma.trainingSession.findUnique({
      where: { id: sessionId },
      select: { id: true, isActive: true },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    const slot = await prisma.trainingSlot.findFirst({
      where: { id: slotId, sessionId },
      include: {
        bookings: { where: { status: 'CONFIRMED' }, select: { id: true } },
      },
    })

    if (!slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 })
    }

    if (slot.bookings.length >= slot.capacity) {
      return NextResponse.json(
        { error: 'Slot is full' },
        { status: 400 }
      )
    }

    // Check if already booked
    const existingBooking = await prisma.trainingBooking.findUnique({
      where: {
        slotId_userId: { slotId, userId: auth.userId },
      },
    })

    if (existingBooking) {
      return NextResponse.json(
        { error: 'You have already booked this slot' },
        { status: 400 }
      )
    }

    // Create booking
    await prisma.trainingBooking.create({
      data: {
        sessionId,
        slotId,
        userId: auth.userId,
        status: 'CONFIRMED',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Book session error:', error)
    return NextResponse.json(
      { error: 'Failed to book session' },
      { status: 500 }
    )
  }
}
