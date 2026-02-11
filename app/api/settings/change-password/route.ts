import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { comparePassword, hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json().catch(() => ({}))
    const { oldPassword, newPassword } = body

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Old password and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { passwordHash: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const valid = comparePassword(oldPassword, user.passwordHash)
    if (!valid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    await prisma.user.update({
      where: { id: auth.userId },
      data: { passwordHash: hashPassword(newPassword) },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    )
  }
}
