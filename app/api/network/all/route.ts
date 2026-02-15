import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { getSubtreeWithDetails } from '@/lib/tree'
import { applyPrivacy, parsePrivacyPrefs } from '@/lib/privacy'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const rootIdParam = searchParams.get('rootId')
    const isAdmin = auth.role === 'SUPER_ADMIN' || auth.role === 'ADMIN'
    const rootId = isAdmin && rootIdParam ? rootIdParam : auth.userId

    let users = await getSubtreeWithDetails(rootId)
    if (process.env.NODE_ENV === 'production') {
      users = users.filter((u) => !(u as { isDemo?: boolean }).isDemo)
    }
    const userIds = users.map((u) => u.id)
    const settingsList = userIds.length > 0
      ? await prisma.userSettings.findMany({ where: { userId: { in: userIds } } })
      : []
    const settingsByUser = Object.fromEntries(settingsList.map((s) => [s.userId, s]))
    const viewerIsAdmin = auth.role === 'SUPER_ADMIN' || auth.role === 'ADMIN'

    const withPrivacy = users.map((u) => {
      const prefs = parsePrivacyPrefs(settingsByUser[u.id]?.privacyPrefs)
      const applied = applyPrivacy(
        { ...u, path: (u as { path?: string[] }).path || [] },
        prefs,
        auth.userId,
        viewerIsAdmin
      )
      return {
        id: u.id,
        name: u.name,
        email: applied.email,
        phone: applied.phone,
        city: applied.city,
        role: u.role,
        roleRank: u.roleRank,
        status: u.status,
        createdAt: u.createdAt,
      }
    })

    return NextResponse.json({ users: withPrivacy })
  } catch (error: any) {
    console.error('Get all downlines error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch network' },
      { status: 500 }
    )
  }
}
