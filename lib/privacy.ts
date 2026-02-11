/**
 * Apply privacy preferences when returning user data to a viewer.
 * Enforce server-side: mask phone, email, city based on target user's privacyPrefs and viewer context.
 */

export type VisibilityOption = 'ADMIN_ONLY' | 'UPLINE_ONLY' | 'NOBODY' | 'SUBTREE' | 'DIRECT_ONLY'

export interface PrivacyPrefs {
  phoneVisibility?: VisibilityOption
  emailVisibility?: VisibilityOption
  cityVisibility?: VisibilityOption
}

export interface UserForPrivacy {
  id: string
  phone?: string | null
  email?: string | null
  city?: string | null
  sponsorId?: string | null
}

/**
 * Check if viewer can see target's field based on privacy prefs.
 * viewerIsAdmin: viewer is SUPER_ADMIN or ADMIN
 * viewerIsDirectUpline: viewer.id === target.sponsorId
 * viewerInSubtree: viewer is in target's path (target is upline of viewer) - for "SUBTREE" we allow everyone in target's subtree to see
 * For cityVisibility SUBTREE: show to users whose path contains target.id (target is upline) OR target's path contains viewer.id (viewer is upline)
 */
export function canSeePhone(
  targetPrefs: PrivacyPrefs,
  viewerIsAdmin: boolean,
  viewerIsDirectUpline: boolean
): boolean {
  const v = targetPrefs.phoneVisibility || 'ADMIN_ONLY'
  if (v === 'NOBODY') return false
  if (v === 'ADMIN_ONLY') return viewerIsAdmin
  if (v === 'UPLINE_ONLY') return viewerIsAdmin || viewerIsDirectUpline
  return false
}

export function canSeeEmail(
  targetPrefs: PrivacyPrefs,
  viewerIsAdmin: boolean,
  viewerIsDirectUpline: boolean
): boolean {
  const v = targetPrefs.emailVisibility || 'ADMIN_ONLY'
  if (v === 'NOBODY') return false
  if (v === 'ADMIN_ONLY') return viewerIsAdmin
  if (v === 'UPLINE_ONLY') return viewerIsAdmin || viewerIsDirectUpline
  return false
}

export function canSeeCity(
  targetPrefs: PrivacyPrefs,
  viewerIsAdmin: boolean,
  viewerIsDirectUpline: boolean,
  viewerInTargetSubtree: boolean // viewer's path includes target.id (target is upline of viewer)
): boolean {
  const v = targetPrefs.cityVisibility || 'SUBTREE'
  if (v === 'NOBODY') return false
  if (v === 'ADMIN_ONLY') return viewerIsAdmin
  if (v === 'DIRECT_ONLY') return viewerIsAdmin || viewerIsDirectUpline
  if (v === 'SUBTREE') return viewerIsAdmin || viewerIsDirectUpline || viewerInTargetSubtree
  return false
}

/**
 * Apply privacy to a user object for a given viewer. Returns sanitized user.
 */
export function applyPrivacy(
  target: UserForPrivacy & { path?: string[] },
  targetPrefs: PrivacyPrefs,
  viewerId: string,
  viewerIsAdmin: boolean
): Partial<UserForPrivacy> {
  const viewerIsDirectUpline = target.sponsorId === viewerId
  const viewerInTargetSubtree = Array.isArray(target.path) && target.path.includes(viewerId)

  return {
    ...target,
    phone: canSeePhone(targetPrefs, viewerIsAdmin, viewerIsDirectUpline) ? target.phone : undefined,
    email: canSeeEmail(targetPrefs, viewerIsAdmin, viewerIsDirectUpline) ? target.email : undefined,
    city: canSeeCity(targetPrefs, viewerIsAdmin, viewerIsDirectUpline, !!viewerInTargetSubtree) ? target.city : undefined,
  }
}

export function parsePrivacyPrefs(json: string | null | undefined): PrivacyPrefs {
  if (!json) return {}
  try {
    return JSON.parse(json) as PrivacyPrefs
  } catch {
    return {}
  }
}
