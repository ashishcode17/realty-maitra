import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/auth'
import { handleApiError } from '@/lib/error-handler'
import { checkOtpVerifyRateLimit } from '@/lib/rateLimit'
import { verifyFirebaseIdToken } from '@/lib/firebase-admin'

function normalizeForCompare(phone: string): string {
  const s = phone.replace(/\D/g, '')
  if (s.length >= 10 && s.startsWith('91')) return s.slice(-10)
  return s.slice(-10)
}

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
    const { email, firebaseIdToken } = body
    const emailStr = typeof email === 'string' ? email.trim().toLowerCase() : ''
    const idToken = typeof firebaseIdToken === 'string' ? firebaseIdToken.trim() : ''

    if (!emailStr || !idToken) {
      return NextResponse.json(
        { error: 'Email and phone verification are required', code: 'MISSING_FIELDS' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const decoded = await verifyFirebaseIdToken(idToken)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired phone verification', code: 'INVALID_FIREBASE_TOKEN' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: emailStr },
    })
    if (!user || (user.status !== 'ACTIVE' && user.status !== 'FROZEN')) {
      return NextResponse.json(
        { error: 'Account not found or inactive', code: 'ACCOUNT_INACTIVE' },
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
    if (!user.phone) {
      return NextResponse.json(
        { error: 'No phone on file', code: 'NO_PHONE' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const tokenPhone = normalizeForCompare(decoded.phone_number)
    const userPhone = normalizeForCompare(user.phone)
    if (tokenPhone !== userPhone) {
      return NextResponse.json(
        { error: 'Phone does not match this account', code: 'PHONE_MISMATCH' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

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
