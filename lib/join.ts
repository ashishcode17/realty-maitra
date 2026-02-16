/**
 * Official join logic — single place for invite code resolution and tree assignment.
 * See docs/OFFICIAL_APP_RULEBOOK.md.
 */

import { prisma } from './prisma'

export const JOIN_ERROR_CODES = {
  INVALID_INVITE_CODE: 'INVALID_SPONSOR_CODE',
  EMAIL_TAKEN: 'EMAIL_TAKEN',
  PHONE_TAKEN: 'PHONE_TAKEN',
  OWN_INVITE_CODE: 'OWN_INVITE_CODE',
  FORBIDDEN_VISIBILITY: 'forbidden_visibility',
} as const

/** Normalize invite code: uppercase, trim. Case-insensitive lookup. */
export function normalizeInviteCode(code: string | undefined): string {
  return (code && String(code).trim().toUpperCase()) || ''
}

export type ResolvedSponsor = {
  id: string
  path: string[]
  sponsorCode: string
  name: string
  role: string
  rank: string
}

/**
 * Resolve invite code to the sponsor (ACTIVE user who owns that code).
 * Server-side only. Used at registration.
 * Returns null if code invalid or sponsor not ACTIVE.
 */
export async function resolveSponsorFromInviteCode(
  inviteCode: string
): Promise<ResolvedSponsor | null> {
  const code = normalizeInviteCode(inviteCode)
  if (!code) return null

  const sponsor = await prisma.user.findFirst({
    where: { sponsorCode: code, status: 'ACTIVE' },
    select: { id: true, path: true, sponsorCode: true, name: true, role: true, rank: true },
  })

  if (!sponsor) return null
  return {
    id: sponsor.id,
    path: sponsor.path ?? [],
    sponsorCode: sponsor.sponsorCode ?? code,
    name: sponsor.name,
    role: sponsor.role,
    rank: sponsor.rank,
  }
}

/**
 * Compute path for a new user under the given sponsor.
 * path = sponsor.id ? [...sponsor.path, sponsor.id] : []
 */
export function computePathForNewUser(sponsor: ResolvedSponsor | null): string[] {
  if (!sponsor || !sponsor.id) return []
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
  return normalizeInviteCode(inviteCode) !== normalizeInviteCode(ownSponsorCode)
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
