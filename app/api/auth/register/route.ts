import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateOTP, hashOTP, generateSponsorCode } from '@/lib/auth'
import { getRoleRank } from '@/lib/roles'
import { handleApiError } from '@/lib/error-handler'
import { checkRateLimit, checkOtpSendRateLimit } from '@/lib/rateLimit'
import { sendOTPEmail } from '@/lib/email'
import { sendOTPSms } from '@/lib/sms'
import { nanoid } from 'nanoid'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8
const OTP_EXPIRY_MS = 10 * 60 * 1000 // 10 minutes
const isDev = process.env.NODE_ENV !== 'production'

export async function POST(request: NextRequest) {
  try {
    const rate = checkRateLimit(request)
    if (!rate.ok) {
      return NextResponse.json(
        { error: 'Too many attempts', message: 'Please try again later', code: 'RATE_LIMIT', retryAfter: rate.retryAfter },
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rate.retryAfter) } }
      )
    }
    const otpRate = checkOtpSendRateLimit(request)
    if (!otpRate.ok) {
      return NextResponse.json(
        { error: 'Too many OTP requests', message: 'Please try again later', code: 'RATE_LIMIT', retryAfter: otpRate.retryAfter },
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(otpRate.retryAfter) } }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { name, email, phone, city, password, sponsorCode } = body
    const nameStr = typeof name === 'string' ? name.trim() : ''
    const emailStr = typeof email === 'string' ? email.trim().toLowerCase() : ''
    const passwordStr = typeof password === 'string' ? password : ''
    const sponsorCodeStr = typeof sponsorCode === 'string' ? sponsorCode.trim().toUpperCase() : ''

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

    // Remove any previous pending registration for this email
    await prisma.user.deleteMany({
      where: { email: `pending_${emailStr}` },
    })
    await prisma.otpVerification.deleteMany({
      where: { identifier: emailStr, purpose: 'REGISTER' },
    })

    const otp = generateOTP()
    const otpHash = hashOTP(otp)
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS)
    const pendingCode = `PEND_${nanoid(6).toUpperCase()}`

    const pendingUser = await prisma.user.create({
      data: {
        name: nameStr,
        email: `pending_${emailStr}`,
        phone: typeof phone === 'string' ? phone.trim() || null : null,
        city: typeof city === 'string' ? city.trim() || null : null,
        passwordHash: hashPassword(passwordStr),
        role: 'BDM',
        roleRank: getRoleRank('BDM'),
        sponsorId: sponsor.id,
        path: [...(sponsor.path || []), sponsor.id],
        status: 'PENDING_VERIFICATION',
        emailVerified: false,
        sponsorCode: pendingCode,
      },
    })

    await prisma.otpVerification.create({
      data: {
        identifier: emailStr,
        otpHash,
        purpose: 'REGISTER',
        meta: JSON.stringify({ pendingUserId: pendingUser.id }),
        expiresAt,
      },
    })

    const phoneStr = typeof phone === 'string' ? phone.trim() : ''
    const [emailSent, smsSent] = await Promise.all([
      sendOTPEmail(emailStr, otp),
      phoneStr ? sendOTPSms(phoneStr, otp) : Promise.resolve(false),
    ])
    if (!emailSent && !smsSent && isDev) {
      console.log(`[Dev] OTP for ${emailStr}${phoneStr ? ` / ${phoneStr}` : ''}: ${otp}`)
    }

    const channels: string[] = []
    if (emailSent) channels.push('email')
    if (smsSent) channels.push('phone')
    const message =
      channels.length === 2
        ? 'OTP sent to your email and phone'
        : channels.length === 1
          ? `OTP sent to your ${channels[0]}`
          : process.env.SMTP_USER && process.env.SMTP_PASS
            ? 'OTP could not be sent. Check email and phone, or try again.'
            : 'OTP sent (check your inbox and messages). If you don’t receive it, contact support.'

    const res: { message: string; email: string; mockOTP?: string; sentTo?: string[] } = {
      message,
      email: emailStr,
      sentTo: channels.length ? channels : undefined,
    }
    if (isDev) {
      res.mockOTP = otp
    }

    return NextResponse.json(res, { headers: { 'Content-Type': 'application/json' } })
  } catch (error: unknown) {
    return handleApiError(error, 'Register')
  }
}
