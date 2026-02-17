import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateOTP, hashOTP } from '@/lib/auth'
import { getRoleRank } from '@/lib/roles'
import { handleApiError } from '@/lib/error-handler'
import { checkRateLimit, checkOtpSendRateLimit } from '@/lib/rateLimit'
import { sendOTPEmail } from '@/lib/email'
import { sendOTPSms } from '@/lib/sms'
import {
  resolveSponsorFromInviteCode,
  normalizeInviteCode,
  computePathForNewUser,
  validateEmailNotTaken,
  validatePhoneNotTaken,
  isFirstUserAllowed,
  JOIN_ERROR_CODES,
} from '@/lib/join'
import { nanoid } from 'nanoid'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8
const OTP_EXPIRY_MS = 10 * 60 * 1000
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
    const { name, email, phone, city, password, sponsorCode, rootAdmin } = body
    const nameStr = typeof name === 'string' ? name.trim() : ''
    const emailStr = typeof email === 'string' ? email.trim().toLowerCase() : ''
    const phoneStr = typeof phone === 'string' ? phone.trim() : ''
    const passwordStr = typeof password === 'string' ? password : ''
    const sponsorCodeStr = normalizeInviteCode(sponsorCode)
    const isRootPath = rootAdmin === true || rootAdmin === 'true'

    const firstUserAllowed = await isFirstUserAllowed()
    if (isRootPath && !firstUserAllowed) {
      return NextResponse.json(
        { error: 'Only the first user can create the root admin.', code: 'ROOT_ALREADY_EXISTS' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!nameStr || !emailStr || !phoneStr || !passwordStr) {
      return NextResponse.json(
        { error: 'All fields are required', code: 'MISSING_FIELDS' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!isRootPath && !sponsorCodeStr) {
      if (firstUserAllowed) {
        return NextResponse.json(
          { error: 'Enter an invite code or create the root admin.', code: 'INVITE_OR_ROOT' },
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
      return NextResponse.json(
        { error: 'A valid invite code is required to register.', code: 'invite_code_required' },
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

    const emailOk = await validateEmailNotTaken(emailStr)
    if (!emailOk) {
      return NextResponse.json(
        { error: 'Email already registered', code: JOIN_ERROR_CODES.EMAIL_TAKEN },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const phoneOk = await validatePhoneNotTaken(phoneStr)
    if (!phoneOk) {
      return NextResponse.json(
        { error: 'Phone already registered', code: 'PHONE_TAKEN' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    let sponsor: Awaited<ReturnType<typeof resolveSponsorFromInviteCode>> = null
    let isFirstUser = false
    let path: string[] = []
    let role: 'SUPER_ADMIN' | 'ADMIN' | 'DIRECTOR' | 'VP' | 'AVP' | 'SSM' | 'SM' | 'BDM' = 'BDM'
    let rank: 'ADMIN' | 'DIRECTOR' | 'VP' | 'SSM' | 'SM' | 'BDM' = 'BDM'
    let isDirectorSeed = false
    let createdByDirectorId: string | null = null

    if (isRootPath && firstUserAllowed) {
      isFirstUser = true
      path = []
      role = 'SUPER_ADMIN'
      rank = 'ADMIN'
    } else {
      sponsor = await resolveSponsorFromInviteCode(sponsorCodeStr)
      if (!sponsor) {
        return NextResponse.json(
          { error: 'The invite code you entered is invalid. Please verify and try again.', code: JOIN_ERROR_CODES.INVALID_INVITE_CODE },
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
      path = computePathForNewUser(sponsor)
      isDirectorSeed = sponsor.isDirectorSeed
      createdByDirectorId = isDirectorSeed ? sponsor.id : null
      role = 'BDM'
      rank = 'BDM'
    }

    await prisma.user.deleteMany({ where: { email: `pending_${emailStr}` } })
    await prisma.otpVerification.deleteMany({ where: { identifier: emailStr, purpose: 'REGISTER' } })

    const otp = generateOTP()
    const otpHash = hashOTP(otp)
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS)
    const pendingCode = `PEND_${nanoid(6).toUpperCase()}`

    const pendingUser = await prisma.user.create({
      data: {
        name: nameStr,
        email: `pending_${emailStr}`,
        phone: phoneStr,
        city: typeof city === 'string' ? city.trim() || null : null,
        passwordHash: hashPassword(passwordStr),
        role,
        roleRank: getRoleRank(role),
        sponsorId: isFirstUser || isDirectorSeed ? null : sponsor!.id,
        path,
        rank,
        status: 'PENDING_VERIFICATION',
        emailVerified: false,
        sponsorCode: pendingCode,
        sponsorCodeUsed: !isFirstUser && sponsor ? sponsor.sponsorCode : null,
      },
    })

    await prisma.otpVerification.create({
      data: {
        identifier: emailStr,
        otpHash,
        purpose: 'REGISTER',
        meta: JSON.stringify({
          pendingUserId: pendingUser.id,
          isDirectorSeed,
          createdByDirectorId,
        }),
        expiresAt,
      },
    })

    const [emailSent, smsSent] = await Promise.all([
      sendOTPEmail(emailStr, otp),
      sendOTPSms(phoneStr, otp),
    ])
    if (!emailSent && !smsSent && isDev) {
      console.log(`[Dev] OTP for ${emailStr}${phoneStr ? ` / ${phoneStr}` : ''}: ${otp}`)
    }

    const channels: string[] = []
    if (emailSent) channels.push('email')
    if (smsSent) channels.push('phone')
    const attemptedSms = !!phoneStr
    const smsFailed = attemptedSms && !smsSent
    let message: string
    if (channels.length === 2) {
      message = 'OTP sent to your email and phone'
    } else if (emailSent) {
      message = smsFailed ? 'OTP sent to your email. SMS could not be sent.' : 'OTP sent to your email'
    } else if (smsSent) {
      message = 'OTP sent to your phone'
    } else {
      message = phoneStr || process.env.SMTP_USER
        ? 'OTP could not be sent. Check number and email, or try again.'
        : 'OTP sent. Check your inbox and messages.'
    }

    const res: { message: string; email: string; mockOTP?: string; sentTo?: string[]; smsFailed?: boolean } = {
      message,
      email: emailStr,
      sentTo: channels.length ? channels : undefined,
    }
    if (smsFailed) res.smsFailed = true
    if (isDev) res.mockOTP = otp

    return NextResponse.json(res, { headers: { 'Content-Type': 'application/json' } })
  } catch (error: unknown) {
    return handleApiError(error, 'Register')
  }
}
