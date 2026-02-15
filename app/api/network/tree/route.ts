import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { getSubtreeWithDetails } from '@/lib/tree'
import { calculateTreeStats } from '@/lib/treeUtils'
import { handleApiError } from '@/lib/error-handler'
import { applyPrivacy, parsePrivacyPrefs } from '@/lib/privacy'

const isProduction = process.env.NODE_ENV === 'production'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Subtree-only: never load all users; only current user's downline
    let subtreeUsers = await getSubtreeWithDetails(auth.userId)
    if (isProduction) {
      subtreeUsers = subtreeUsers.filter((u) => !(u as { isDemo?: boolean }).isDemo)
    }

    const userIds = subtreeUsers.map((u) => u.id)
    const settingsList = userIds.length > 0
      ? await prisma.userSettings.findMany({ where: { userId: { in: userIds } } })
      : []
    const settingsByUser = Object.fromEntries(settingsList.map((s) => [s.userId, s]))
    const viewerIsAdmin = auth.role === 'SUPER_ADMIN' || auth.role === 'ADMIN'

    const sanitizedUsers = subtreeUsers.map((u) => {
      const prefs = parsePrivacyPrefs(settingsByUser[u.id]?.privacyPrefs)
      const applied = applyPrivacy(
        { ...u, path: u.path || [] },
        prefs,
        auth.userId,
        viewerIsAdmin
      )
      const uAny = u as { sponsorCode?: string | null; lastActive?: Date | null; updatedAt?: Date }
      return {
        id: u.id,
        name: u.name,
        email: applied.email,
        phone: applied.phone,
        city: applied.city,
        role: u.role,
        roleRank: u.roleRank,
        parentId: u.sponsorId,
        path: u.path || [],
        sponsorCode: uAny.sponsorCode ?? '',
        status: u.status,
        createdAt: u.createdAt,
        lastActive: uAny.lastActive ?? uAny.updatedAt ?? u.createdAt,
      }
    })

    const stats = calculateTreeStats([...subtreeUsers, user], user.id)

    return NextResponse.json({
      tree: sanitizedUsers,
      stats,
    })
  } catch (error: any) {
    return handleApiError(error, 'Get Tree')
  }
}
