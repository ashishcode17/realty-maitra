import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware'
import { runTreeInvariantChecks } from '@/lib/treeInvariants'

/**
 * GET: Admin-only. Run tree invariant checks (path matches ancestry, no cycles, parent exists).
 * See docs/OFFICIAL_APP_RULEBOOK.md and lib/treeInvariants.ts.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    const result = await runTreeInvariantChecks()
    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error('Tree invariants error:', error)
    return NextResponse.json(
      { error: 'Failed to run invariant checks' },
      { status: 500 }
    )
  }
}
