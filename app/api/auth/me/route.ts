import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        profilePhotoUrl: true,
        role: true,
        roleRank: true,
        status: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
        sponsorId: true,
        sponsorCode: true,
        sponsorCodeUsed: true,
        rank: true,
        isDemo: true,
        sponsor: {
          select: { id: true, name: true, sponsorCode: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const sponsor = user.sponsor
    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      profilePhotoUrl: user.profilePhotoUrl,
      role: user.role,
      roleRank: user.roleRank,
      status: user.status,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      createdAt: user.createdAt,
      sponsorId: user.sponsorId,
        sponsorCode: user.sponsorCode,
        sponsorCodeUsed: user.sponsorCodeUsed,
        rank: user.rank,
        isDemo: user.isDemo,
        joinedUnderSponsorName: sponsor?.name ?? null,
        joinedUnderSponsorCode: user.sponsorCodeUsed ?? sponsor?.sponsorCode ?? null,
    }
    return NextResponse.json({ user: userPayload })
  } catch (error: any) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch user',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
        code: error.code,
      },
      { status: 500 }
    )
  }
}
