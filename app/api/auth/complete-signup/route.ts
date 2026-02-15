import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateSponsorCode } from '@/lib/auth'
import { getRoleRank } from '@/lib/roles'
import { ensureDemoSponsorExists } from '@/lib/ensure-demo-sponsor'

/**
 * POST: Complete sign-up after Clerk auth. Body: { sponsorCode, name }.
 * Creates Prisma User linked to Clerk and returns success.
 */
export async function POST(request: NextRequest) {
  const { userId, sessionClaims } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Sign in with Clerk first' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const sponsorCodeStr = typeof body.sponsorCode === 'string' ? body.sponsorCode.trim().toUpperCase() : ''
  const nameStr = typeof body.name === 'string' ? body.name.trim() : ''

  const emailFromClerk = (sessionClaims?.email as string) || (sessionClaims?.preferred_username as string)
  const email = typeof emailFromClerk === 'string' ? emailFromClerk.trim().toLowerCase() : ''

  if (!nameStr || !sponsorCodeStr) {
    return NextResponse.json(
      { error: 'Name and sponsor code are required', code: 'MISSING_FIELDS' },
      { status: 400 }
    )
  }
  if (!email) {
    return NextResponse.json(
      { error: 'Email not found from Clerk', code: 'NO_EMAIL' },
      { status: 400 }
    )
  }

  const existing = await prisma.user.findFirst({
    where: { clerkUserId: userId },
  })
  if (existing) {
    return NextResponse.json({ message: 'Already onboarded', user: existing })
  }

  if (await prisma.user.findUnique({ where: { email } })) {
    return NextResponse.json(
      { error: 'This email is already registered', code: 'EMAIL_TAKEN' },
      { status: 400 }
    )
  }

  let sponsor = await prisma.user.findFirst({
    where: { sponsorCode: sponsorCodeStr, status: 'ACTIVE' },
    select: { id: true, path: true },
  })
  if (!sponsor && sponsorCodeStr === 'DEMO1234') {
    sponsor = await ensureDemoSponsorExists()
  }
  if (!sponsor) {
    return NextResponse.json(
      { error: 'Invalid sponsor code', code: 'INVALID_SPONSOR_CODE' },
      { status: 400 }
    )
  }

  const passwordHash = hashPassword('CLERK_NO_PASSWORD_' + userId)

  const user = await prisma.user.create({
    data: {
      clerkUserId: userId,
      name: nameStr,
      email,
      passwordHash,
      role: 'BDM',
      roleRank: getRoleRank('BDM'),
      status: 'ACTIVE',
      emailVerified: true,
      sponsorId: sponsor.id,
      path: [...(sponsor.path || []), sponsor.id],
      sponsorCode: generateSponsorCode(),
      sponsorCodeUsed: sponsorCodeStr,
    },
  })

  return NextResponse.json({ message: 'Welcome!', user: { id: user.id, name: user.name, email: user.email } })
}
