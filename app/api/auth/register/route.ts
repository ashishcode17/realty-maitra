import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateSponsorCode } from '@/lib/auth'
import { getRoleRank } from '@/lib/roles'
import { handleApiError } from '@/lib/error-handler'
import { checkRateLimit } from '@/lib/rateLimit'
import { verifyFirebaseIdToken } from '@/lib/firebase-admin'
import { createAuditLog, getClientIp } from '@/lib/audit'
import { sendWelcomeEmail } from '@/lib/email'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8


export async function POST(request: NextRequest) {
  try {
    const rate = checkRateLimit(request)
    if (!rate.ok) {
      return NextResponse.json(
        { error: 'Too many attempts', message: 'Please try again later', code: 'RATE_LIMIT', retryAfter: rate.retryAfter },
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rate.retryAfter) } }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { name, email, phone, city, password, sponsorCode, firebaseIdToken } = body
    const nameStr = typeof name === 'string' ? name.trim() : ''
    const emailStr = typeof email === 'string' ? email.trim().toLowerCase() : ''
    const passwordStr = typeof password === 'string' ? password : ''
    const sponsorCodeStr = typeof sponsorCode === 'string' ? sponsorCode.trim().toUpperCase() : ''
    const idToken = typeof firebaseIdToken === 'string' ? firebaseIdToken.trim() : ''

    if (!idToken) {
      return NextResponse.json(
        { error: 'Phone verification required', message: 'Complete phone OTP verification first', code: 'MISSING_FIREBASE_TOKEN' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    if (!nameStr || !emailStr || !passwordStr || !sponsorCodeStr) {
      return NextResponse.json(
        { error: 'All fields are required', code: 'MISSING_FIELDS' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    if (!EMAIL_REGEX.test(emailStr)) {
      return NextResponse.json(
        { error: 'Invalid email format', code: 'INVALID_EMAIL' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    if (passwordStr.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`, code: 'WEAK_PASSWORD' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const decoded = await verifyFirebaseIdToken(idToken)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired phone verification', message: 'Please verify your phone again', code: 'INVALID_FIREBASE_TOKEN' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    const phoneToStore = decoded.phone_number || (typeof phone === 'string' ? phone.trim() || null : null)

    const existingUser = await prisma.user.findUnique({ where: { email: emailStr } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered', code: 'EMAIL_TAKEN' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const sponsor = await prisma.user.findFirst({
      where: { sponsorCode: sponsorCodeStr, status: 'ACTIVE' },
      select: { id: true, sponsorCode: true, path: true },
    })
    if (!sponsor) {
      return NextResponse.json(
        { error: 'Invalid sponsor code', code: 'INVALID_SPONSOR_CODE' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const newUser = await prisma.user.create({
      data: {
        name: nameStr,
        email: emailStr,
        phone: phoneToStore,
        city: typeof city === 'string' ? city.trim() || null : null,
        passwordHash: hashPassword(passwordStr),
        role: 'BDM',
        roleRank: getRoleRank('BDM'),
        sponsorId: sponsor.id,
        path: [...(sponsor.path || []), sponsor.id],
        sponsorCode: generateSponsorCode(),
        sponsorCodeUsed: sponsorCodeStr,
        status: 'ACTIVE',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        phoneVerified: true,
        phoneVerifiedAt: new Date(),
      },
    })

    createAuditLog({
      actorUserId: newUser.id,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: newUser.id,
      metaJson: { sponsorId: newUser.sponsorId, sponsorCodeUsed: sponsorCodeStr },
      ip: getClientIp(request),
    }).catch(() => {})

    sendWelcomeEmail(emailStr, newUser.name).catch(() => {})

    const { generateToken } = await import('@/lib/auth')
    const token = generateToken(newUser.id, newUser.role, (newUser as { tokenVersion?: number }).tokenVersion ?? 0)

    return NextResponse.json(
      {
        message: 'Registration successful',
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          sponsorCode: newUser.sponsorCode ?? '',
        },
      },
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    return handleApiError(error, 'Register')
  }
}
