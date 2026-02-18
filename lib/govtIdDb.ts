/**
 * Govt ID stored in Postgres (free, works on any host including serverless).
 * When idImageUrl === 'db', the image is in GovIdStorage table.
 */

import { prisma } from '@/lib/prisma'

const DB_MARKER = 'db'

export function isDbStoredGovtId(idImageUrl: string | null): boolean {
  return idImageUrl === DB_MARKER
}

export async function saveGovtIdToDb(
  userId: string,
  buffer: Buffer,
  mime: 'image/jpeg' | 'image/png'
): Promise<void> {
  await prisma.govIdStorage.upsert({
    where: { userId },
    create: { userId, content: buffer, mime },
    update: { content: buffer, mime },
  })
}

export async function getGovtIdFromDb(userId: string): Promise<{ buffer: Buffer; mime: string } | null> {
  const row = await prisma.govIdStorage.findUnique({
    where: { userId },
    select: { content: true, mime: true },
  })
  if (!row) return null
  return {
    buffer: Buffer.from(row.content),
    mime: row.mime,
  }
}

/** Copy Govt ID from pending user to new user (on verify-otp). */
export async function copyGovtIdInDb(fromUserId: string, toUserId: string): Promise<void> {
  const row = await prisma.govIdStorage.findUnique({
    where: { userId: fromUserId },
  })
  if (!row) return
  await prisma.govIdStorage.upsert({
    where: { userId: toUserId },
    create: { userId: toUserId, content: row.content, mime: row.mime },
    update: { content: row.content, mime: row.mime },
  })
  await prisma.govIdStorage.delete({ where: { userId: fromUserId } }).catch(() => {})
}

export const GOVT_ID_DB_MARKER = DB_MARKER
