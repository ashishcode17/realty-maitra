import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * GET: After Clerk sign-in, check if we have a Prisma user for this Clerk user.
 * Returns { user } or { needOnboarding: true }.
 */
export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  const user = await prisma.user.findFirst({
    where: { clerkUserId: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      city: true,
      profilePhotoUrl: true,
      role: true,
      roleRank: true,
      status: true,
      emailVerified: true,
      phoneVerified: true,
      createdAt: true,
      sponsorId: true,
      isDemo: true,
    },
  })

  if (!user || (user.status !== 'ACTIVE' && user.status !== 'FROZEN')) {
    return NextResponse.json({ needOnboarding: true })
  }

  return NextResponse.json({ user })
}
