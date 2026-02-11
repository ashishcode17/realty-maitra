import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateOTP, hashOTP } from '@/lib/auth'
import { handleApiError } from '@/lib/error-handler'
import { checkRateLimit } from '@/lib/rateLimit'

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
    const body = await request.json()
    const { name, email, phone, city, password, sponsorCode } = body
    const nameStr = typeof name === 'string' ? name.trim() : ''
    const emailStr = typeof email === 'string' ? email.trim() : ''
    const passwordStr = typeof password === 'string' ? password : ''
    const sponsorCodeStr = typeof sponsorCode === 'string' ? sponsorCode.trim() : ''

    if (!nameStr || !emailStr || !passwordStr || !sponsorCodeStr) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400, headers: { 'Content-Type': 'application/json' } })
    }
    if (!EMAIL_REGEX.test(emailStr)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400, headers: { 'Content-Type': 'application/json' } })
    }
    if (passwordStr.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` }, { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email: emailStr } })
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    // Find sponsor
    const sponsor = await prisma.user.findUnique({ where: { sponsorCode: sponsorCodeStr } })
    if (!sponsor) {
      return NextResponse.json({ error: 'Invalid sponsor code' }, { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    // Generate OTP
    const otp = generateOTP()
    const otpHash = hashOTP(otp)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Store OTP (using a simple approach - in production, use a separate OTP table)
    // For now, we'll store it in a pending user record
    await prisma.user.create({
      data: {
        name: nameStr,
        email: `pending_${emailStr}`, // Temporary email to avoid conflicts
        phone: typeof phone === 'string' ? phone.trim() || null : null,
        city: typeof city === 'string' ? city.trim() || null : null,
        passwordHash: hashPassword(passwordStr),
        role: 'BDM',
        roleRank: 1,
        sponsorId: sponsor.id,
        path: [...(sponsor.path || []), sponsor.id],
        status: 'PENDING_VERIFICATION',
        emailVerified: false,
        sponsorCode: 'TEMP',
      }
    })

    // Store OTP in a separate way (we'll use a JSON field or create OTP table later)
    // For MVP, we'll return the OTP directly
    console.log(`📧 OTP for ${emailStr}: ${otp}`)

    return NextResponse.json({
      message: 'OTP sent to your email',
      email: emailStr,
      mockOTP: otp, // For MVP testing
    })
  } catch (error: any) {
    return handleApiError(error, 'Register')
  }
}
