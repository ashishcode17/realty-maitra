import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware'

/**
 * Dev-only: wipe demo data (isDemo: true). Only in development.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth

    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Demo clear is disabled in production' },
        { status: 403 }
      )
    }

    await prisma.fileDownloadLog.deleteMany({ where: { isDemo: true } })
    await prisma.trainingCompletion.deleteMany({ where: { isDemo: true } })
    await prisma.challengeEnrollment.deleteMany({ where: { isDemo: true } })
    await prisma.trainingBooking.deleteMany({ where: { isDemo: true } })
    await prisma.trainingSlot.deleteMany({ where: { isDemo: true } })
    await prisma.trainingSession.deleteMany({ where: { isDemo: true } })
    await prisma.earnings.deleteMany({ where: { isDemo: true } })
    await prisma.projectDocument.deleteMany({ where: { isDemo: true } })
    await prisma.trainingContent.deleteMany({ where: { isDemo: true } })
    await prisma.offerChallenge.deleteMany({ where: { isDemo: true } })
    await prisma.notification.deleteMany({ where: { isDemo: true } })
    await prisma.slabConfig.deleteMany({ where: { isDemo: true } })
    await prisma.project.deleteMany({ where: { isDemo: true } })
    await prisma.user.deleteMany({ where: { isDemo: true } })

    return NextResponse.json({ success: true, message: 'Demo data cleared' })
  } catch (error: any) {
    console.error('Admin demo clear error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to clear demo data' },
      { status: 500 }
    )
  }
}
