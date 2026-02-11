import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword, generateToken } from '@/lib/auth'
import { handleApiError } from '@/lib/error-handler'
import { checkRateLimit } from '@/lib/rateLimit'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  try {
    const rate = checkRateLimit(request)
    if (!rate.ok) {
      return NextResponse.json(
        { error: 'Too many attempts', message: 'Please try again later', code: 'RATE_LIMIT', retryAfter: rate.retryAfter },
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rate.retryAfter) } }
      )
    }
    // Test database connection first
    try {
      await prisma.$connect()
    } catch (dbConnError: any) {
      console.error('Database connection error:', dbConnError)
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          message: 'Please check your DATABASE_URL in .env file. Get a free database from https://neon.tech',
          code: 'DATABASE_CONNECTION_ERROR'
        },
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    const { email, password } = body
    const emailStr = typeof email === 'string' ? email.trim() : ''
    const passwordStr = typeof password === 'string' ? password : ''

    if (!emailStr || !passwordStr) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    if (!EMAIL_REGEX.test(emailStr)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Find user
    let user
    try {
      user = await prisma.user.findUnique({
        where: { email: emailStr },
      })
    } catch (dbError: any) {
      console.error('Database query error:', dbError)
      return NextResponse.json(
        { 
          error: 'Database query failed',
          message: dbError?.message ?? 'Please run: npm run db:migrate (then restart the app)',
          code: dbError?.code ?? 'DATABASE_QUERY_ERROR'
        },
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verify password
    const isValid = comparePassword(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Allow ACTIVE or FROZEN (FROZEN can login but has restricted actions)
    if (user.status !== 'ACTIVE' && user.status !== 'FROZEN') {
      return NextResponse.json(
        { error: 'Your account is not active. Please contact support.' },
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Update last active and create session for "active devices" list
    const userAgent = request.headers.get('user-agent') || 'Unknown device'
    const tokenVersion = (user as { tokenVersion?: number }).tokenVersion ?? 0
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastActive: new Date() }
      })
      await prisma.userSession.create({
        data: {
          userId: user.id,
          deviceInfo: userAgent.length > 200 ? userAgent.substring(0, 200) : userAgent,
          lastActive: new Date(),
        },
      })
    } catch (updateError: any) {
      console.error('Failed to update lastActive / create session:', updateError)
      // Continue anyway - not critical
    }

    // Generate token (include tokenVersion for logout-all invalidation)
    const token = generateToken(user.id, user.role, tokenVersion)

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        sponsorCode: user.sponsorCode || '',
      },
    }, {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    console.error('Login route error:', error)
    // Use centralized error handler but ensure JSON response
    const errorResponse = handleApiError(error, 'Login')
    // Ensure Content-Type header is set
    errorResponse.headers.set('Content-Type', 'application/json')
    return errorResponse
  } finally {
    // Disconnect Prisma (optional, but good practice)
    try {
      await prisma.$disconnect()
    } catch (e) {
      // Ignore disconnect errors
    }
  }
}
