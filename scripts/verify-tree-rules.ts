/**
 * Minimal verification script for official tree/join rules.
 * Run: npx tsx scripts/verify-tree-rules.ts
 * Requires DATABASE_URL. Does not mutate data; only reads and checks.
 *
 * Checks:
 * - resolveSponsorFromInviteCode: invalid code returns null
 * - Tree: getSubtreeUsers returns only downline (no upline)
 * - Invariant: runTreeInvariantChecks passes (path matches, no cycles)
 */

import 'dotenv/config'
import { prisma } from '../lib/prisma'
import { resolveSponsorFromInviteCode, normalizeInviteCode } from '../lib/join'
import { getSubtreeUsers, canAccessUser } from '../lib/tree'
import { runTreeInvariantChecks } from '../lib/treeInvariants'

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL required')
    process.exit(1)
  }

  console.log('Verifying tree/join rules...\n')
  let failed = 0

  const invalidCode = await resolveSponsorFromInviteCode('INVALID_CODE_XYZ_999')
  if (invalidCode !== null) {
    console.error('FAIL: Invalid invite code should return null')
    failed++
  } else {
    console.log('PASS: Invalid invite code returns null')
  }

  if (normalizeInviteCode('  abc123  ') !== 'ABC123') {
    console.error('FAIL: normalizeInviteCode should uppercase and trim')
    failed++
  } else {
    console.log('PASS: normalizeInviteCode uppercase and trim')
  }

  const users = await prisma.user.findMany({
    take: 5,
    select: { id: true, sponsorId: true, path: true },
  })
  if (users.length >= 2) {
    const [u1, u2] = users
    const subtree1 = await getSubtreeUsers(u1.id)
    if (subtree1.includes(u1.id)) {
      console.error('FAIL: getSubtreeUsers should not include self (downline only)')
      failed++
    } else {
      console.log('PASS: getSubtreeUsers returns only downline (not self)')
    }
    const canAccess = await canAccessUser(u1.id, u2.id)
    const u2InU1Path = (u2.path ?? []).includes(u1.id)
    if (canAccess && !u2InU1Path && u1.id !== u2.id) {
      console.error('FAIL: canAccessUser should be false when target not in subtree')
      failed++
    } else {
      console.log('PASS: canAccessUser respects subtree')
    }
  }

  const invariant = await runTreeInvariantChecks()
  if (!invariant.ok) {
    console.error('FAIL: Tree invariants:', invariant.errors)
    failed++
  } else {
    console.log(`PASS: Tree invariants (${invariant.checked} users checked)`)
  }

  console.log('')
  if (failed > 0) {
    console.error(`${failed} check(s) failed`)
    process.exit(1)
  }
  console.log('All checks passed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
