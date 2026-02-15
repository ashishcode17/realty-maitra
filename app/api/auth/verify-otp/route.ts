import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { compareOTP, generateToken, generateSponsorCode } from '@/lib/auth'
import { getRoleRank } from '@/lib/roles'
import { handleApiError } from '@/lib/error-handler'
import { checkOtpVerifyRateLimit } from '@/lib/rateLimit'
import { sendWelcomeEmail } from '@/lib/email'
import { createAuditLog, getClientIp } from '@/lib/audit'

export async function POST(request: NextRequest) {
  try {
    const rate = checkOtpVerifyRateLimit(request)
    if (!rate.ok) {
      return NextResponse.json(
        {
          error: 'Too many attempts',
          message: 'Please try again later',
          code: 'RATE_LIMIT',
          retryAfter: rate.retryAfter,
        },
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rate.retryAfter) } }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { email, otp } = body
    const emailStr = typeof email === 'string' ? email.trim().toLowerCase() : ''
    const otpStr = typeof otp === 'string' ? otp.trim() : ''

    if (!emailStr || !otpStr) {
      return NextResponse.json(
        { error: 'Email and OTP are required', code: 'MISSING_FIELDS' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    if (otpStr.length !== 6 || !/^\d+$/.test(otpStr)) {
      return NextResponse.json(
        { error: 'Invalid OTP format', code: 'INVALID_OTP' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const record = await prisma.otpVerification.findFirst({
      where: { identifier: emailStr, purpose: 'REGISTER' },
      orderBy: { createdAt: 'desc' },
    })

    if (!record) {
      return NextResponse.json(
        { error: 'OTP expired or not found', code: 'OTP_EXPIRED' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    if (new Date() > record.expiresAt) {
      await prisma.otpVerification.delete({ where: { id: record.id } }).catch(() => {})
      return NextResponse.json(
        { error: 'OTP expired', code: 'OTP_EXPIRED' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const valid = compareOTP(otpStr, record.otpHash)
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid OTP', code: 'INVALID_OTP' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    let meta: { pendingUserId?: string } = {}
    try {
      meta = record.meta ? JSON.parse(record.meta) : {}
    } catch {
      meta = {}
    }
    const pendingUserId = meta.pendingUserId
    if (!pendingUserId) {
      return NextResponse.json(
        { error: 'Registration data not found', code: 'INVALID_STATE' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const pendingUser = await prisma.user.findUnique({
      where: { id: pendingUserId },
      include: { sponsor: { select: { sponsorCode: true } } },
    })

    if (!pendingUser || !pendingUser.email.startsWith('pending_')) {
      await prisma.otpVerification.delete({ where: { id: record.id } }).catch(() => {})
      return NextResponse.json(
        { error: 'Registration expired', code: 'OTP_EXPIRED' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const actualEmail = pendingUser.email.replace(/^pending_/, '')
    const sponsorCodeUsed = pendingUser.sponsor?.sponsorCode ?? null

    const newUser = await prisma.user.create({
      data: {
        name: pendingUser.name,
        email: actualEmail,
        phone: pendingUser.phone,
        city: pendingUser.city,
        passwordHash: pendingUser.passwordHash,
        role: 'BDM',
        roleRank: getRoleRank('BDM'),
        sponsorId: pendingUser.sponsorId,
        path: pendingUser.path ?? [],
        sponsorCode: generateSponsorCode(),
        sponsorCodeUsed,
        status: 'ACTIVE',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        phoneVerified: true,
        phoneVerifiedAt: new Date(),
      },
    })

    await prisma.otpVerification.delete({ where: { id: record.id } }).catch(() => {})
    await prisma.user.delete({ where: { id: pendingUserId } }).catch(() => {})

    await createAuditLog({
      actorUserId: newUser.id,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: newUser.id,
      metaJson: { sponsorId: newUser.sponsorId, sponsorCodeUsed },
      ip: getClientIp(request),
    }).catch(() => {})

    sendWelcomeEmail(actualEmail, newUser.name).catch(() => {})

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
    return handleApiError(error, 'Verify OTP')
  }
}
