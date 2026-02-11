import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const decoded = verifyToken(token)
      if (decoded?.userId) {
        await prisma.user.update({
          where: { id: decoded.userId },
          data: { tokenVersion: { increment: 1 } },
        })
      }
    }
    return NextResponse.json({ success: true, message: 'Logged out successfully' })
  } catch {
    return NextResponse.json({ success: true, message: 'Logged out successfully' })
  }
}
