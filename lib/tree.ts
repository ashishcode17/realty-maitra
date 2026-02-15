import { prisma } from './prisma'
import { UserRole } from '@prisma/client'

/**
 * Get all users in a user's subtree (downline only)
 * This enforces the critical rule: users can only see their own subtree
 */
export async function getSubtreeUsers(userId: string) {
  // Get all direct and indirect downlines using recursive CTE would be ideal
  // For now, we'll use a simpler approach with multiple queries
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, sponsorId: true },
  })

  if (!user) return []

  // Recursively get all downlines
  const getAllDownlines = async (parentId: string): Promise<string[]> => {
    const directDownlines = await prisma.user.findMany({
      where: { sponsorId: parentId },
      select: { id: true },
    })

    const allIds = directDownlines.map((u) => u.id)

    // Recursively get downlines of each direct downline
    for (const downline of directDownlines) {
      const nested = await getAllDownlines(downline.id)
      allIds.push(...nested)
    }

    return allIds
  }

  const downlineIds = await getAllDownlines(userId)
  return downlineIds
}

/**
 * Get full subtree with user details
 */
export async function getSubtreeWithDetails(userId: string) {
  const downlineIds = await getSubtreeUsers(userId)

  if (downlineIds.length === 0) return []

  return prisma.user.findMany({
    where: { id: { in: downlineIds } },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      city: true,
      role: true,
      roleRank: true,
      status: true,
      createdAt: true,
      sponsorId: true,
      path: true,
      isDemo: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Get direct downlines only
 */
export async function getDirectDownlines(userId: string) {
  return prisma.user.findMany({
    where: { sponsorId: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      city: true,
      role: true,
      roleRank: true,
      status: true,
      createdAt: true,
      sponsorId: true,
      path: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Build tree structure for visualization
 */
export interface TreeNode {
  id: string
  name: string
  email: string
  role: UserRole
  city?: string | null
  status: string
  children: TreeNode[]
}

export async function buildTreeStructure(userId: string): Promise<TreeNode[]> {
  const users = await getSubtreeWithDetails(userId)

  // Create a map for quick lookup
  const userMap = new Map<string, TreeNode>()

  // Initialize all nodes
  users.forEach((user) => {
    userMap.set(user.id, {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      city: user.city,
      status: user.status,
      children: [],
    })
  })

  // Build tree structure
  const rootNodes: TreeNode[] = []

  users.forEach((user) => {
    const node = userMap.get(user.id)!
    if (user.sponsorId === userId) {
      // Direct downline of the root user
      rootNodes.push(node)
    } else if (user.sponsorId && userMap.has(user.sponsorId)) {
      // Child of another node in the subtree
      const parent = userMap.get(user.sponsorId)!
      parent.children.push(node)
    }
  })

  return rootNodes
}

/**
 * Get upline path (for calculating bonuses)
 */
export async function getUplinePath(userId: string, levels: number = 2): Promise<string[]> {
  const uplines: string[] = []
  let currentUserId: string | null = userId

  for (let i = 0; i < levels; i++) {
    const user = await prisma.user.findUnique({
      where: { id: currentUserId! },
      select: { sponsorId: true },
    })

    if (!user || !user.sponsorId) break

    uplines.push(user.sponsorId)
    currentUserId = user.sponsorId
  }

  return uplines
}

/**
 * Check if user can access another user's data
 * Users can only access their own data or data in their subtree
 */
export async function canAccessUser(viewerId: string, targetUserId: string): Promise<boolean> {
  if (viewerId === targetUserId) return true

  const subtreeIds = await getSubtreeUsers(viewerId)
  return subtreeIds.includes(targetUserId)
}

/**
 * Recompute path for a user (from their sponsor) and all their descendants.
 * Call after changing sponsorId. path = sponsor ? [...sponsor.path, sponsor.id] : []
 */
export async function recomputePathForUserAndDescendants(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, sponsorId: true, path: true },
  })
  if (!user) return

  let newPath: string[] = []
  if (user.sponsorId) {
    const sponsor = await prisma.user.findUnique({
      where: { id: user.sponsorId },
      select: { path: true },
    })
    newPath = [...(sponsor?.path ?? []), user.sponsorId]
  }

  await prisma.user.update({
    where: { id: userId },
    data: { path: newPath },
  })

  const directDownlines = await prisma.user.findMany({
    where: { sponsorId: userId },
    select: { id: true },
  })
  for (const d of directDownlines) {
    await recomputePathForUserAndDescendants(d.id)
  }
}

/**
 * Reassign a user's sponsor and recompute paths for user and all descendants.
 * Validates: newSponsorId must not be the user themselves or in the user's subtree (no cycles).
 */
export async function updateSponsorAndRecomputePaths(
  userId: string,
  newSponsorId: string | null
): Promise<{ ok: boolean; error?: string }> {
  if (userId === newSponsorId) {
    return { ok: false, error: 'User cannot be their own sponsor' }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, sponsorId: true },
  })
  if (!user) return { ok: false, error: 'User not found' }

  if (newSponsorId) {
    const newSponsor = await prisma.user.findUnique({
      where: { id: newSponsorId },
      select: { id: true },
    })
    if (!newSponsor) return { ok: false, error: 'New sponsor not found' }

    const subtreeIds = await getSubtreeUsers(userId)
    if (subtreeIds.includes(newSponsorId)) {
      return { ok: false, error: 'New sponsor cannot be in the user\'s downline (would create a cycle)' }
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { sponsorId: newSponsorId },
  })
  await recomputePathForUserAndDescendants(userId)
  return { ok: true }
}
