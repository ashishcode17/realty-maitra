import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/error-handler'
import { checkRateLimit } from '@/lib/rateLimit'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Returns the phone number for the given email so the client can send Firebase OTP to it.
 * Used for login-with-OTP flow (Firebase Phone Auth).
 */
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
    const emailStr = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (!emailStr || !EMAIL_REGEX.test(emailStr)) {
      return NextResponse.json(
        { error: 'Valid email is required', code: 'INVALID_EMAIL' },
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
    if (!user.phone || !user.phone.trim()) {
      return NextResponse.json(
        { error: 'No phone on file for this account', code: 'NO_PHONE' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const phone = user.phone.trim()
    const e164 = phone.startsWith('+') ? phone : `+91${phone.replace(/^0/, '')}`
    return NextResponse.json(
      { phone: e164 },
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    return handleApiError(error, 'Get login phone')
  }
}
