/**
 * One-time invite code lifecycle. See OFFICIAL_APP_RULEBOOK.
 * - Validate: lookup InviteCodeRecord by code where usedAt is null.
 * - After successful registration: mark record used, regenerate new code for inviter.
 */

import { prisma } from './prisma'
import { generateShortInviteCode } from './auth'

export function normalizeInviteCode(code: string | undefined): string {
  return (code && String(code).trim().toUpperCase()) || ''
}

/** Resolve code to active invite record (usedAt is null). Returns record + owner user. */
export async function findActiveInviteByCode(code: string) {
  const c = normalizeInviteCode(code)
  if (!c) return null
  const record = await prisma.inviteCodeRecord.findFirst({
    where: { code: c, usedAt: null },
    include: {
      user: {
        select: {
          id: true,
          path: true,
          sponsorCode: true,
          name: true,
          role: true,
          rank: true,
          treeId: true,
        },
      },
    },
  })
  return record?.user ? { record, sponsor: record.user } : null
}

/** Mark invite as used and regenerate new code for owner. Call after successful registration. */
export async function markInviteUsedAndRegenerate(params: {
  inviteCodeUsed: string
  usedByUserId: string
}) {
  const { inviteCodeUsed, usedByUserId } = params
  const code = normalizeInviteCode(inviteCodeUsed)
  if (!code) return

  const active = await prisma.inviteCodeRecord.findFirst({
    where: { code, usedAt: null },
    select: { id: true, userId: true },
  })
  if (!active) return

  await prisma.$transaction(async (tx) => {
    await tx.inviteCodeRecord.update({
      where: { id: active.id },
      data: { usedAt: new Date(), usedByUserId },
    })
    const newCode = generateShortInviteCode(5)
    let attempts = 0
    while (attempts < 10) {
      try {
        await tx.inviteCodeRecord.create({
          data: { code: newCode, userId: active.userId },
        })
        await tx.user.update({
          where: { id: active.userId },
          data: { sponsorCode: newCode },
        })
        return
      } catch (e: unknown) {
        const isUnique = (e as { code?: string })?.code === 'P2002'
        if (isUnique && attempts < 9) {
          attempts++
          continue
        }
        throw e
      }
    }
  })
}

/** Ensure user has an active InviteCodeRecord (e.g. root admin after creation). Creates one if missing. */
export async function ensureActiveInviteForUser(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { sponsorCode: true, id: true },
  })
  if (!user) return null
  const existing = await prisma.inviteCodeRecord.findFirst({
    where: { userId, usedAt: null },
    select: { code: true },
  })
  if (existing) return existing.code
  let code = user.sponsorCode
  if (!code) {
    code = generateShortInviteCode(5)
    await prisma.user.update({
      where: { id: userId },
      data: { sponsorCode: code },
    })
  }
  for (let i = 0; i < 10; i++) {
    const c = code || generateShortInviteCode(5)
    try {
      await prisma.inviteCodeRecord.create({
        data: { code: c, userId },
      })
      return c
    } catch (e: unknown) {
      if ((e as { code?: string })?.code === 'P2002') {
        code = generateShortInviteCode(5)
        await prisma.user.update({ where: { id: userId }, data: { sponsorCode: code } }).catch(() => {})
        continue
      }
      throw e
    }
  }
  return null
}
