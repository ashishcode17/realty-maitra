import { NextRequest, NextResponse } from 'next/server'
import { generateOTP, storeOTP } from '@/lib/otp'
import { sendOTPEmail } from '@/lib/email'
import { requireAuth } from '@/lib/middleware'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const { type = 'email' } = body

    // Generate new OTP
    const otp = generateOTP()
    storeOTP(auth.email, otp, type as 'email' | 'phone')

    if (type === 'email') {
      await sendOTPEmail(auth.email, otp)
    }
    // For phone OTP, you'd integrate with SMS service here

    return NextResponse.json({
      success: true,
      message: `OTP sent to your ${type}`,
    })
  } catch (error: any) {
    console.error('Resend OTP error:', error)
    return NextResponse.json(
      { error: 'Failed to send OTP. Please try again.' },
      { status: 500 }
    )
  }
}
