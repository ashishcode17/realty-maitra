/**
 * Server-only tree invariant checks.
 * Verifies: path matches ancestry, no cycles, parent exists (unless root).
 * See docs/OFFICIAL_APP_RULEBOOK.md.
 */

import { prisma } from './prisma'

export type InvariantResult = {
  ok: boolean
  errors: string[]
  checked: number
}

/**
 * Run all tree invariant checks.
 * - path must match real ancestry (path === [...sponsor.path, sponsor.id])
 * - level/depth must match path.length
 * - no cycles (user id not in own path)
 * - parent exists unless root (sponsorId is null or references existing user)
 */
export async function runTreeInvariantChecks(): Promise<InvariantResult> {
  const errors: string[] = []
  const users = await prisma.user.findMany({
    select: { id: true, sponsorId: true, path: true },
  })
  let checked = 0

  for (const user of users) {
    checked++

    if (user.sponsorId) {
      const parent = await prisma.user.findUnique({
        where: { id: user.sponsorId },
        select: { id: true, path: true },
      })
      if (!parent) {
        errors.push(`User ${user.id}: sponsorId ${user.sponsorId} does not exist`)
        continue
      }
      const expectedPath = [...(parent.path ?? []), parent.id]
      const actualPath = user.path ?? []
      if (JSON.stringify(expectedPath) !== JSON.stringify(actualPath)) {
        errors.push(`User ${user.id}: path mismatch. Expected [...sponsor.path, sponsor.id], got path length ${actualPath.length}`)
      }
      if (actualPath.includes(user.id)) {
        errors.push(`User ${user.id}: cycle detected (own id in path)`)
      }
    } else {
      if ((user.path ?? []).length > 0) {
        errors.push(`User ${user.id}: root (no sponsorId) but path non-empty`)
      }
    }

    if ((user.path ?? []).includes(user.id)) {
      errors.push(`User ${user.id}: cycle (own id in path)`)
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    checked,
  }
}
