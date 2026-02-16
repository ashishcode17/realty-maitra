import { NextRequest, NextResponse } from 'next/server'
import { resolveSponsorFromInviteCode } from '@/lib/join'
import { getAllowedRanksForSponsor } from '@/lib/ranks'
import { getRankLabel } from '@/lib/ranks'

/**
 * POST: Public. Body: { inviteCode }. Validates code and returns sponsor info + allowed ranks.
 * Used by registration UI to show "Joining under" and rank options.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const inviteCode = typeof body.inviteCode === 'string' ? body.inviteCode.trim() : ''
    if (!inviteCode) {
      return NextResponse.json(
        { error: 'Invite code is required', code: 'MISSING_INVITE_CODE' },
        { status: 400 }
      )
    }

    const sponsor = await resolveSponsorFromInviteCode(inviteCode)
    if (!sponsor) {
      return NextResponse.json(
        { error: 'The invite code you entered is invalid. Please verify and try again.', code: 'INVALID_SPONSOR_CODE' },
        { status: 400 }
      )
    }

    const allowedRanks = getAllowedRanksForSponsor({
      sponsorRank: sponsor.rank as 'ADMIN' | 'DIRECTOR' | 'VP' | 'SSM' | 'SM' | 'BDM',
      sponsorRole: sponsor.role,
    })

    return NextResponse.json({
      ok: true,
      sponsorName: sponsor.name,
      sponsorCode: sponsor.sponsorCode,
      sponsorRank: sponsor.rank,
      sponsorRankLabel: getRankLabel(sponsor.rank),
      allowedRanks: allowedRanks.map((r) => ({ value: r, label: getRankLabel(r) })),
    })
  } catch (e) {
    console.error('Validate invite error:', e)
    return NextResponse.json(
      { error: 'Failed to validate invite code', code: 'VALIDATION_ERROR' },
      { status: 500 }
    )
  }
}
