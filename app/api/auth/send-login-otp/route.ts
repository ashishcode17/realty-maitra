import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateOTP, hashOTP } from '@/lib/auth'
import { handleApiError } from '@/lib/error-handler'
import { checkOtpSendRateLimit } from '@/lib/rateLimit'
import { sendOTPEmail } from '@/lib/email'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const OTP_EXPIRY_MS = 10 * 60 * 1000 // 10 minutes
const isDev = process.env.NODE_ENV !== 'production'

export async function POST(request: NextRequest) {
  try {
    const rate = checkOtpSendRateLimit(request)
    if (!rate.ok) {
      return NextResponse.json(
        {
          error: 'Too many OTP requests',
          message: 'Please try again later',
          code: 'RATE_LIMIT',
          retryAfter: rate.retryAfter,
        },
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rate.retryAfter) } }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { email } = body
    const emailStr = typeof email === 'string' ? email.trim().toLowerCase() : ''

    if (!emailStr) {
      return NextResponse.json(
        { error: 'Email is required', code: 'MISSING_EMAIL' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    if (!EMAIL_REGEX.test(emailStr)) {
      return NextResponse.json(
        { error: 'Invalid email format', code: 'INVALID_EMAIL' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: emailStr },
      select: { id: true, status: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email', code: 'USER_NOT_FOUND' },
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }
    if (user.status !== 'ACTIVE' && user.status !== 'FROZEN') {
      return NextResponse.json(
        { error: 'Account is not active', code: 'ACCOUNT_INACTIVE' },
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    await prisma.otpVerification.deleteMany({
      where: { identifier: emailStr, purpose: 'LOGIN' },
    })

    const otp = generateOTP()
    const otpHash = hashOTP(otp)
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS)

    await prisma.otpVerification.create({
      data: {
        identifier: emailStr,
        otpHash,
        purpose: 'LOGIN',
        meta: null,
        expiresAt,
      },
    })

    const sent = await sendOTPEmail(emailStr, otp)
    if (!sent && isDev) {
      console.log(`[Dev] Login OTP for ${emailStr}: ${otp}`)
    }

    const res: { message: string; mockOTP?: string } = { message: 'OTP sent to your email' }
    if (isDev) res.mockOTP = otp

    return NextResponse.json(res, { headers: { 'Content-Type': 'application/json' } })
  } catch (error: unknown) {
    return handleApiError(error, 'Send login OTP')
  }
}
