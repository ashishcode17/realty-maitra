/**
 * Official join logic — invite code resolution (one-time codes) and tree assignment.
 * See docs/OFFICIAL_APP_RULEBOOK.md.
 */

import { prisma } from './prisma'
import { findActiveInviteByCode, normalizeInviteCode as normalizeInviteCodeFromInvite } from './invite'

export const JOIN_ERROR_CODES = {
  INVALID_INVITE_CODE: 'INVALID_SPONSOR_CODE',
  EMAIL_TAKEN: 'EMAIL_TAKEN',
  PHONE_TAKEN: 'PHONE_TAKEN',
  OWN_INVITE_CODE: 'OWN_INVITE_CODE',
  FORBIDDEN_VISIBILITY: 'forbidden_visibility',
} as const

export function normalizeInviteCode(code: string | undefined): string {
  return normalizeInviteCodeFromInvite(code)
}

export type ResolvedSponsor = {
  id: string
  path: string[]
  sponsorCode: string
  name: string
  role: string
  rank: string
  treeId: string | null
  /** True when inviter is Admin/Director: new user becomes tree root, not under inviter. */
  isDirectorSeed: boolean
}

/** Admin/Director roles that seed new tree roots (new user is not under them). */
function isDirectorOrAdmin(role: string): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'DIRECTOR'
}

/**
 * Resolve invite code to sponsor via one-time InviteCodeRecord (usedAt is null).
 * Returns null if code invalid, used, or owner not ACTIVE.
 */
export async function resolveSponsorFromInviteCode(
  inviteCode: string
): Promise<ResolvedSponsor | null> {
  const result = await findActiveInviteByCode(inviteCode)
  if (!result) return null
  const sponsor = result.sponsor
  const activeUser = await prisma.user.findFirst({
    where: { id: sponsor.id, status: 'ACTIVE' },
    select: { id: true, path: true, sponsorCode: true, name: true, role: true, rank: true, treeId: true },
  })
  if (!activeUser) return null
  return {
    id: activeUser.id,
    path: activeUser.path ?? [],
    sponsorCode: activeUser.sponsorCode ?? inviteCode.trim().toUpperCase(),
    name: activeUser.name,
    role: activeUser.role,
    rank: activeUser.rank,
    treeId: activeUser.treeId ?? null,
    isDirectorSeed: isDirectorOrAdmin(activeUser.role),
  }
}

/**
 * Compute path for a new user. Director seed => []; else sponsor path + sponsor id.
 */
export function computePathForNewUser(sponsor: ResolvedSponsor | null): string[] {
  if (!sponsor || !sponsor.id || sponsor.isDirectorSeed) return []
  return [...sponsor.path, sponsor.id]
}

/**
 * Validate: email not already registered.
 */
export async function validateEmailNotTaken(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase()
  const existing = await prisma.user.findUnique({
    where: { email: normalized },
    select: { id: true },
  })
  return !existing
}

/**
 * Validate: phone not already registered (when phone is required).
 * Empty phone skips check.
 */
export async function validatePhoneNotTaken(phone: string): Promise<boolean> {
  const trimmed = phone.trim()
  if (!trimmed) return true
  const existing = await prisma.user.findFirst({
    where: { phone: trimmed },
    select: { id: true },
  })
  return !existing
}

/**
 * Ensure new user cannot use their own invite code (e.g. in future flows).
 * At registration the new user doesn't have a code yet, so this is for consistency.
 */
export function validateNotOwnInviteCode(
  inviteCode: string,
  ownSponsorCode: string | null
): boolean {
  if (!ownSponsorCode) return true
  return normalizeInviteCodeFromInvite(inviteCode) !== normalizeInviteCodeFromInvite(ownSponsorCode)
}

/**
 * First user (root) rule: if no users exist, registration is allowed without invite code.
 * Server-side only. Exclude pending (email starting with pending_) from count.
 */
export async function isFirstUserAllowed(): Promise<boolean> {
  const count = await prisma.user.count({
    where: { email: { not: { startsWith: 'pending_' } } },
  })
  return count === 0
}
