import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { compareOTP, generateToken, generateSponsorCode } from '@/lib/auth'
import { getRoleRank } from '@/lib/roles'
import { handleApiError } from '@/lib/error-handler'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, otp } = body

    // For MVP, we'll use a simple approach
    // In production, you'd have a separate OTP table
    // For now, we'll check if the OTP matches (stored in console/log)
    
    // Find pending user
    const pendingUser = await prisma.user.findFirst({
      where: {
        email: { startsWith: 'pending_' },
        status: 'PENDING'
      }
    })

    if (!pendingUser) {
      return NextResponse.json({ error: 'Registration data not found' }, { status: 400 })
    }

    // For MVP, accept any 6-digit OTP (in production, verify against stored hash)
    if (!otp || otp.length !== 6) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 })
    }

    // Create actual user
    const actualEmail = pendingUser.email.replace('pending_', '')
    const newUser = await prisma.user.create({
      data: {
        name: pendingUser.name,
        email: actualEmail,
        phone: pendingUser.phone,
        city: pendingUser.city,
        passwordHash: pendingUser.passwordHash,
        role: 'BDM',
        roleRank: getRoleRank('BDM'),
        sponsorId: pendingUser.sponsorId,
        path: pendingUser.path,
        sponsorCode: generateSponsorCode(),
        status: 'ACTIVE',
        emailVerified: true,
      }
    })

    // Delete pending user
    await prisma.user.delete({ where: { id: pendingUser.id } })

    // Generate token
    const token = generateToken(newUser.id, newUser.role)

    return NextResponse.json({
      message: 'Registration successful',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        sponsorCode: newUser.sponsorCode,
      },
    })
  } catch (error: any) {
    return handleApiError(error, 'Verify OTP')
  }
}
