import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware'
import { getDirectDownlines } from '@/lib/tree'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const rootIdParam = searchParams.get('rootId')
    const isAdmin = auth.role === 'SUPER_ADMIN' || auth.role === 'ADMIN'
    const rootId = isAdmin && rootIdParam ? rootIdParam : auth.userId

    const users = await getDirectDownlines(rootId)

    return NextResponse.json({ users })
  } catch (error: any) {
    console.error('Get direct downlines error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch network' },
      { status: 500 }
    )
  }
}
