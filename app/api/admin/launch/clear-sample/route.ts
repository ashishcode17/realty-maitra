import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware'

/**
 * POST: Admin-only. Clears all sample/demo content for official launch:
 * - All offers (OfferChallenge + enrollments)
 * - All training (sessions, slots, bookings, content, completions)
 * - All projects (earnings, lead refs, then projects with cascade)
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    // 1. Offers: delete all (cascade deletes ChallengeEnrollment)
    await prisma.offerChallenge.deleteMany({})

    // 2. Training: bookings → slots → sessions, then content (cascade completions)
    await prisma.trainingBooking.deleteMany({})
    await prisma.trainingSlot.deleteMany({})
    await prisma.trainingSession.deleteMany({})
    await prisma.trainingCompletion.deleteMany({})
    await prisma.trainingContent.deleteMany({})

    // 3. Projects: clear dependent data then projects
    await prisma.earnings.deleteMany({})
    await prisma.lead.updateMany({
      where: { projectInterestId: { not: null } },
      data: { projectInterestId: null },
    })
    await prisma.project.deleteMany({})

    return NextResponse.json({
      success: true,
      message: 'All projects, training, and offers cleared. App is ready for official launch.',
    })
  } catch (error: unknown) {
    console.error('Launch clear-sample error:', error)
    return NextResponse.json(
      { error: 'Failed to clear sample data' },
      { status: 500 }
    )
  }
}
