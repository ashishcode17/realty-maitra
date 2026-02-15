import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { applyPrivacy, parsePrivacyPrefs } from '@/lib/privacy'

/**
 * GET /api/network/children?userId=xxx
 * Returns direct children of userId for lazy expand. userId must be in current user's subtree (403 otherwise).
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const me = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, path: true },
    })
    if (!me) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Subtree enforcement: userId must be me or in my subtree
    if (userId !== auth.userId) {
      const target = await prisma.user.findUnique({
        where: { id: userId },
        select: { path: true },
      })
      if (!target) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      const path = (target.path || []) as string[]
      if (!path.includes(auth.userId)) {
        return NextResponse.json(
          { error: 'You can only load children in your subtree', code: 'forbidden_visibility' },
          { status: 403 }
        )
      }
    }

    const isProduction = process.env.NODE_ENV === 'production'
    const children = await prisma.user.findMany({
      where: {
        sponsorId: userId,
        status: 'ACTIVE',
        ...(isProduction ? { isDemo: false } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        role: true,
        status: true,
        sponsorId: true,
        path: true,
        lastActive: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    const userIds = children.map((u) => u.id)
    const settingsList =
      userIds.length > 0
        ? await prisma.userSettings.findMany({ where: { userId: { in: userIds } } })
        : []
    const settingsByUser = Object.fromEntries(settingsList.map((s) => [s.userId, s]))
    const viewerIsAdmin = auth.role === 'SUPER_ADMIN' || auth.role === 'ADMIN'

    const childCounts = await Promise.all(
      children.map((u) =>
        prisma.user.count({ where: { sponsorId: u.id } })
      )
    )

    const tree = children.map((u, i) => {
      const prefs = parsePrivacyPrefs(settingsByUser[u.id]?.privacyPrefs)
      const applied = applyPrivacy(
        { ...u, path: (u.path || []) as string[] },
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
        status: u.status,
        parentId: u.sponsorId,
        childrenCount: childCounts[i],
        lastActive: u.lastActive || u.updatedAt,
      }
    })

    return NextResponse.json({ children: tree })
  } catch (error: any) {
    console.error('Children API error:', error)
    return NextResponse.json(
      { error: 'Failed to load children' },
      { status: 500 }
    )
  }
}
