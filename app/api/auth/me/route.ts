import { NextRequest, NextResponse } from 'next/server'
import { auth as clerkAuth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      const { userId } = await clerkAuth()
      if (userId) {
        return NextResponse.json({ needOnboarding: true }, { status: 403 })
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.id },
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
        isDemo: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
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
