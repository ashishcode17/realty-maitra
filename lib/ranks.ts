/**
 * Position / Rank system. See docs/OFFICIAL_APP_RULEBOOK.md (sections I, J).
 * Rank = hierarchy position (ADMIN > DIRECTOR > VP > SSM > SM > BDM).
 * Only SUPER_ADMIN/ADMIN (role) can create or assign DIRECTOR.
 */

export type Rank = 'ADMIN' | 'DIRECTOR' | 'VP' | 'SSM' | 'SM' | 'BDM'

export const RANK_ORDER: Rank[] = ['ADMIN', 'DIRECTOR', 'VP', 'SSM', 'SM', 'BDM']

export const RANK_LABELS: Record<Rank, string> = {
  ADMIN: 'Admin',
  DIRECTOR: 'Director',
  VP: 'Vice President (VP)',
  SSM: 'Senior Sales Manager (SSM)',
  SM: 'Sales Manager (SM)',
  BDM: 'Business Development Manager (BDM)',
}

export const RANK_HELPER: Partial<Record<Rank, string>> = {
  VP: 'Leads SSM, SM, BDM teams',
  SSM: 'Leads SM, BDM teams',
  SM: 'Leads BDM teams',
  BDM: 'Entry-level team member',
}

/** All ranks that can be assigned under an admin (SUPER_ADMIN/ADMIN role or rank ADMIN). */
const RANKS_UNDER_ADMIN: Rank[] = ['DIRECTOR', 'VP', 'SSM', 'SM', 'BDM']

/** Ranks allowed under each sponsor rank (sponsor cannot create same or higher rank). */
const ALLOWED_UNDER: Record<Exclude<Rank, 'ADMIN'>, Rank[]> = {
  DIRECTOR: ['VP', 'SSM', 'SM', 'BDM'],
  VP: ['SSM', 'SM', 'BDM'],
  SSM: ['SM', 'BDM'],
  SM: ['BDM'],
  BDM: ['BDM'],
}

/**
 * Get allowed ranks for a new user joining under the given sponsor.
 * - Only if sponsor has role SUPER_ADMIN or ADMIN (or rank ADMIN) can DIRECTOR be allowed.
 * - Otherwise allowed set is from ALLOWED_UNDER[sponsor.rank].
 */
export function getAllowedRanksForSponsor(params: {
  sponsorRank: Rank | null
  sponsorRole: string
}): Rank[] {
  const { sponsorRank, sponsorRole } = params
  const isAdmin = sponsorRole === 'SUPER_ADMIN' || sponsorRole === 'ADMIN' || sponsorRank === 'ADMIN'
  if (isAdmin) return [...RANKS_UNDER_ADMIN]
  if (!sponsorRank) return ['VP', 'SSM', 'SM', 'BDM']
  return ALLOWED_UNDER[sponsorRank] ?? ['BDM']
}

/** Server-side: is the chosen rank allowed under this sponsor? */
export function isRankAllowedUnderSponsor(params: {
  chosenRank: string
  sponsorRank: Rank | null
  sponsorRole: string
}): boolean {
  const allowed = getAllowedRanksForSponsor({
    sponsorRank: params.sponsorRank,
    sponsorRole: params.sponsorRole,
  })
  return allowed.includes(params.chosenRank as Rank)
}

/** Only admin (role) can assign DIRECTOR. Reject DIRECTOR from client unless sponsor is admin. */
export function canAssignDirector(sponsorRole: string, sponsorRank: Rank | null): boolean {
  return sponsorRole === 'SUPER_ADMIN' || sponsorRole === 'ADMIN' || sponsorRank === 'ADMIN'
}

export function getRankLabel(rank: Rank | string): string {
  return RANK_LABELS[rank as Rank] ?? rank
}
