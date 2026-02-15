import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { compareOTP, generateToken } from '@/lib/auth'
import { handleApiError } from '@/lib/error-handler'
import { checkOtpVerifyRateLimit } from '@/lib/rateLimit'

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
      where: { identifier: emailStr, purpose: 'LOGIN' },
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

    const user = await prisma.user.findUnique({
      where: { email: emailStr },
    })

    if (!user || (user.status !== 'ACTIVE' && user.status !== 'FROZEN')) {
      await prisma.otpVerification.delete({ where: { id: record.id } }).catch(() => {})
      return NextResponse.json(
        { error: 'Account not found or inactive', code: 'ACCOUNT_INACTIVE' },
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    await prisma.otpVerification.delete({ where: { id: record.id } }).catch(() => {})

    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastActive: new Date() },
      })
    } catch {
      // non-critical
    }

    const tokenVersion = (user as { tokenVersion?: number }).tokenVersion ?? 0
    const token = generateToken(user.id, user.role, tokenVersion)

    return NextResponse.json(
      {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          sponsorCode: user.sponsorCode ?? '',
        },
      },
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    return handleApiError(error, 'Verify login OTP')
  }
}
