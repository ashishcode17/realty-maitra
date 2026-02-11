import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json().catch(() => ({}))
    const { category, message } = body

    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      return NextResponse.json(
        { error: 'Message is required and must be at least 10 characters' },
        { status: 400 }
      )
    }

    const cat = ['bug', 'feature', 'other'].includes(String(category))
      ? String(category)
      : 'other'

    await prisma.supportTicket.create({
      data: {
        userId: auth.userId,
        category: cat,
        message: message.trim(),
        status: 'OPEN',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Report problem error:', error)
    return NextResponse.json(
      { error: 'Failed to submit report' },
      { status: 500 }
    )
  }
}
