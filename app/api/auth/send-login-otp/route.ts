import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateOTP, hashOTP } from '@/lib/auth'
import { handleApiError } from '@/lib/error-handler'
import { checkOtpSendRateLimit } from '@/lib/rateLimit'
import { sendOTPSms } from '@/lib/sms'

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
      select: { id: true, status: true, phone: true },
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

    // Phone-only test: email OTP disabled until SMS is verified
    const phoneStr = user.phone?.trim() ?? ''
    const smsSent = phoneStr ? await sendOTPSms(phoneStr, otp) : false
    if (!smsSent && isDev) {
      console.log(`[Dev] Login OTP for ${emailStr}: ${otp}`)
    }

    const channels: string[] = smsSent ? ['phone'] : []
    const message = smsSent
      ? 'OTP sent to your phone'
      : phoneStr
        ? 'OTP could not be sent to your phone. Check number or try again.'
        : 'No phone on file. Add phone in profile or contact support.'

    const res: { message: string; mockOTP?: string; sentTo?: string[] } = { message }
    if (isDev) res.mockOTP = otp
    if (channels.length) res.sentTo = channels

    return NextResponse.json(res, { headers: { 'Content-Type': 'application/json' } })
  } catch (error: unknown) {
    return handleApiError(error, 'Send login OTP')
  }
}
