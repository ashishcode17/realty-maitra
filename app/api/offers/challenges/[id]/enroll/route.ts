import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

type EnrollContext = { params: Promise<{ id: string }> }

async function enrollPost(
  request: NextRequest,
  context: EnrollContext
): Promise<NextResponse<{ error: string }> | NextResponse<{ success: boolean }>> {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const { id: challengeId } = await context.params

    // Check if challenge exists and is active
    const challenge = await prisma.offerChallenge.findUnique({
      where: { id: challengeId },
    })

    if (!challenge || !challenge.isActive) {
      return NextResponse.json(
        { error: 'Challenge not found or inactive' },
        { status: 404 }
      )
    }

    if (new Date() > new Date(challenge.endDate)) {
      return NextResponse.json(
        { error: 'Challenge has ended' },
        { status: 400 }
      )
    }

    // FROZEN users cannot enroll in challenges
    const me = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { status: true },
    })
    if (me?.status === 'FROZEN') {
      return NextResponse.json(
        { error: 'Your account is restricted. You cannot enroll in challenges. Contact support.' },
        { status: 403 }
      )
    }

    // Check if already enrolled
    const existing = await prisma.challengeEnrollment.findUnique({
      where: {
        challengeId_userId: {
          challengeId,
          userId: auth.userId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'You are already enrolled in this challenge' },
        { status: 400 }
      )
    }

    // Create enrollment
    await prisma.challengeEnrollment.create({
      data: {
        challengeId,
        userId: auth.userId,
        status: 'ACTIVE',
        progressJson: '{}',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Enroll in challenge error:', error)
    return NextResponse.json(
      { error: 'Failed to enroll in challenge' },
      { status: 500 }
    )
  }
}

export const POST = enrollPost
