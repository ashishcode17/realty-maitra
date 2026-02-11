import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { applyPrivacy, parsePrivacyPrefs } from '@/lib/privacy'

/**
 * GET /api/network/mindmap?rootId=xxx&depth=2
 * Returns subtree for mindmap. rootId must be current user or in current user's subtree (403 otherwise).
 * depth = max levels (default 2: root + direct + their direct).
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const rootId = searchParams.get('rootId') || auth.userId
    const isAdmin = auth.role === 'SUPER_ADMIN' || auth.role === 'ADMIN'
    const maxDepthAllowed = isAdmin ? 30 : 4
    const depth = Math.min(Math.max(parseInt(searchParams.get('depth') || '2', 10), 1), maxDepthAllowed)

    const me = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, path: true },
    })
    if (!me) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Subtree enforcement: rootId must be me or in my subtree — unless viewer is admin
    if (rootId !== auth.userId && !isAdmin) {
      const rootUser = await prisma.user.findUnique({
        where: { id: rootId },
        select: { id: true, path: true },
      })
      if (!rootUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      const path = (rootUser.path || []) as string[]
      if (!path.includes(auth.userId)) {
        return NextResponse.json({ error: 'You can only view your own subtree' }, { status: 403 })
      }
    }

    const allInSubtree = await getSubtreeFlat(rootId, depth)
    const userIds = allInSubtree.map((u) => u.id)
    const settingsList =
      userIds.length > 0
        ? await prisma.userSettings.findMany({ where: { userId: { in: userIds } } })
        : []
    const settingsByUser = Object.fromEntries(settingsList.map((s) => [s.userId, s]))
    const viewerIsAdmin = auth.role === 'SUPER_ADMIN' || auth.role === 'ADMIN'

    const tree = allInSubtree.map((u) => {
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
        parentId: u.id === rootId ? null : u.sponsorId,
        childrenCount: (u as { _count?: number })._count ?? 0,
        lastActive: u.lastActive || u.updatedAt,
      }
    })

    return NextResponse.json({
      rootId,
      depth,
      tree,
      stats: {
        total: tree.length,
        direct: tree.filter((n) => n.parentId === rootId).length,
      },
    })
  } catch (error: any) {
    console.error('Mindmap API error:', error)
    return NextResponse.json(
      { error: 'Failed to load mindmap' },
      { status: 500 }
    )
  }
}

async function getSubtreeFlat(
  rootId: string,
  maxDepth: number
): Promise<
  ({
    id: string
    name: string
    email: string | null
    phone: string | null
    city: string | null
    role: string
    status: string
    sponsorId: string | null
    path: string[] | null
    lastActive: Date | null
    updatedAt: Date
    parentId: string | null
    _count: number
  })[]
> {
  const root = await prisma.user.findUnique({
    where: { id: rootId },
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
  })
  if (!root) return []

  const result: any[] = [{ ...root, parentId: null, _count: 0 }]
  let currentLevel = [rootId]
  let depth = 0
  while (depth < maxDepth) {
    const nextLevel: string[] = []
    for (const parentId of currentLevel) {
      const children = await prisma.user.findMany({
        where: { sponsorId: parentId, status: 'ACTIVE' },
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
      })
      for (const u of children) {
        result.push({ ...u, parentId: u.sponsorId, _count: 0 })
        nextLevel.push(u.id)
      }
    }
    currentLevel = nextLevel
    depth++
  }

  for (const node of result) {
    node._count = result.filter((n) => n.parentId === node.id).length
  }
  return result
}
