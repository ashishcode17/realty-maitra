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
import path from 'path'
import fs from 'fs/promises'
import { randomUUID } from 'crypto'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8
const OTP_EXPIRY_MS = 10 * 60 * 1000
const isDev = process.env.NODE_ENV !== 'production'
const GOVT_ID_DIR = path.join(process.cwd(), 'uploads', 'govt-ids')
const GOVT_ID_MAX_SIZE = 2 * 1024 * 1024 // 2MB
const GOVT_ID_ALLOWED_TYPES = ['image/jpeg', 'image/png']

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

    const contentType = request.headers.get('content-type') ?? ''
    let nameStr: string
    let emailStr: string
    let phoneStr: string
    let cityStr: string
    let passwordStr: string
    let sponsorCodeStr: string
    let isRootPath: boolean
    let govtIdFile: File | null = null

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const get = (k: string) => formData.get(k)
      nameStr = typeof get('name') === 'string' ? String(get('name')).trim() : ''
      emailStr = typeof get('email') === 'string' ? String(get('email')).trim().toLowerCase() : ''
      phoneStr = typeof get('phone') === 'string' ? String(get('phone')).trim() : ''
      cityStr = typeof get('city') === 'string' ? String(get('city')).trim() : ''
      passwordStr = typeof get('password') === 'string' ? String(get('password')) : ''
      sponsorCodeStr = normalizeInviteCode(String(get('sponsorCode') ?? ''))
      isRootPath = get('rootAdmin') === true || get('rootAdmin') === 'true'
      const file = formData.get('govtId') ?? formData.get('file')
      if (file instanceof File && file.size > 0) govtIdFile = file
    } else {
      const body = await request.json().catch(() => ({}))
      const { name, email, phone, city, password, sponsorCode, rootAdmin } = body
      nameStr = typeof name === 'string' ? name.trim() : ''
      emailStr = typeof email === 'string' ? email.trim().toLowerCase() : ''
      phoneStr = typeof phone === 'string' ? phone.trim() : ''
      cityStr = typeof city === 'string' ? city.trim() : ''
      passwordStr = typeof password === 'string' ? password : ''
      sponsorCodeStr = normalizeInviteCode(sponsorCode)
      isRootPath = rootAdmin === true || rootAdmin === 'true'
    }

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

    if (!isRootPath && !govtIdFile) {
      return NextResponse.json(
        { error: 'Govt ID image is required to register.', code: 'GOVT_ID_REQUIRED' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    if (govtIdFile) {
      if (govtIdFile.size > GOVT_ID_MAX_SIZE) {
        return NextResponse.json(
          { error: 'Govt ID file too large. Maximum size is 2MB.', code: 'GOVT_ID_TOO_LARGE' },
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
      const mime = (govtIdFile.type ?? '').toLowerCase()
      if (!GOVT_ID_ALLOWED_TYPES.includes(mime)) {
        return NextResponse.json(
          { error: 'Invalid Govt ID file type. Only JPG and PNG are allowed.', code: 'GOVT_ID_INVALID_TYPE' },
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
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
        city: cityStr || null,
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

    if (govtIdFile) {
      const ext = govtIdFile.type === 'image/png' ? '.png' : '.jpg'
      const fileName = `${pendingUser.id}_${randomUUID()}${ext}`
      const filePath = path.join(GOVT_ID_DIR, fileName)
      const relativePath = path.join('uploads', 'govt-ids', fileName).replace(/\\/g, '/')
      await fs.mkdir(GOVT_ID_DIR, { recursive: true })
      const buffer = Buffer.from(await govtIdFile.arrayBuffer())
      await fs.writeFile(filePath, buffer)
      await prisma.user.update({
        where: { id: pendingUser.id },
        data: { idImageUrl: relativePath, idImageUploadedAt: new Date() },
      })
    }

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
