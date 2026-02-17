/**
 * Append-only user join/exit ledger. See OFFICIAL_APP_RULEBOOK.
 */

import { prisma } from './prisma'

export const USER_LEDGER_EVENTS = ['JOINED', 'DELETED', 'DEACTIVATED', 'REACTIVATED'] as const
export type UserLedgerEventType = (typeof USER_LEDGER_EVENTS)[number]

export type UserLedgerSnapshot = {
  name?: string | null
  email?: string | null
  phone?: string | null
  city?: string | null
  state?: string | null
  rank?: string | null
  role?: string | null
  treeId?: string | null
  profileImageUrl?: string | null
  govtIdImageUrl?: string | null
  inviterUserId?: string | null
  inviterCode?: string | null
}

export async function writeUserLedgerEvent(params: {
  userId: string
  eventType: UserLedgerEventType
  snapshot: UserLedgerSnapshot
  performedBy?: string | null
}): Promise<void> {
  const { userId, eventType, snapshot, performedBy } = params
  await prisma.userLedger.create({
    data: {
      userId,
      eventType,
      performedBy: performedBy ?? null,
      name: snapshot.name ?? null,
      email: snapshot.email ?? null,
      phone: snapshot.phone ?? null,
      city: snapshot.city ?? null,
      state: snapshot.state ?? null,
      rank: snapshot.rank ?? null,
      role: snapshot.role ?? null,
      treeId: snapshot.treeId ?? null,
      profileImageUrl: snapshot.profileImageUrl ?? null,
      govtIdImageUrl: snapshot.govtIdImageUrl ?? null,
      inviterUserId: snapshot.inviterUserId ?? null,
      inviterCode: snapshot.inviterCode ?? null,
    },
  })
}
