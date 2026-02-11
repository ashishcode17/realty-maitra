import { prisma } from './prisma'
import { getUplinePath } from './tree'
import type { UserRole } from '@prisma/client'

const ROLE_TO_SLAB_KEY: Record<string, keyof Pick<
  { directorPct: number; vpPct: number; avpPct: number; ssmPct: number; smPct: number; bdmPct: number },
  'directorPct' | 'vpPct' | 'avpPct' | 'ssmPct' | 'smPct' | 'bdmPct'
>> = {
  DIRECTOR: 'directorPct',
  VP: 'vpPct',
  AVP: 'avpPct',
  SSM: 'ssmPct',
  SM: 'smPct',
  BDM: 'bdmPct',
  ADMIN: 'bdmPct',
  SUPER_ADMIN: 'bdmPct',
}

export interface CreateEarningsInput {
  userId: string
  projectId: string
  baseAmount: number
  bookingId?: string | null
  notes?: string | null
  approvedBy?: string | null
}

/**
 * Calculate slab percentage for a user's role from project SlabConfig.
 */
export async function getSlabPctForUser(
  projectId: string,
  role: string
): Promise<number> {
  const slab = await prisma.slabConfig.findUnique({
    where: { projectId },
  })
  if (!slab) return 0
  const key = ROLE_TO_SLAB_KEY[role] ?? 'bdmPct'
  return (slab as Record<string, number>)[key] ?? 0
}

/**
 * Create earnings for a sale: one record for the agent (calculatedAmount + upline bonuses metadata)
 * and one record per upline (bonus amount). All in a transaction.
 */
export async function calculateAndCreateEarnings(input: CreateEarningsInput) {
  const { userId, projectId, baseAmount, bookingId = null, notes = null, approvedBy = null } = input

  const [user, project, slab] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    }),
    prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    }),
    prisma.slabConfig.findUnique({
      where: { projectId },
    }),
  ])

  if (!user || !project) {
    throw new Error('User or project not found')
  }

  const slabPct = slab
    ? (slab[ROLE_TO_SLAB_KEY[user.role] ?? 'bdmPct'] ?? 0)
    : 0
  const calculatedAmount = (baseAmount * slabPct) / 100

  const uplineIds = await getUplinePath(userId, 2)
  const uplineBonus1Pct = slab?.uplineBonus1Pct ?? 5
  const uplineBonus2Pct = slab?.uplineBonus2Pct ?? 5
  const uplineBonus1 = (baseAmount * uplineBonus1Pct) / 100
  const uplineBonus2 = (baseAmount * uplineBonus2Pct) / 100
  // Agent receives calculatedAmount; uplineBonus1/2 are paid to uplines (separate records)
  const totalForAgent = calculatedAmount

  const created = await prisma.$transaction(async (tx) => {
    const agentEarning = await tx.earnings.create({
      data: {
        userId,
        projectId,
        bookingId,
        baseAmount,
        slabPct,
        calculatedAmount,
        uplineBonus1,
        uplineBonus2,
        totalAmount: totalForAgent,
        status: 'PENDING',
        notes: notes ?? undefined,
        approvedBy: approvedBy ?? undefined,
      },
    })

    const uplineRecords: typeof agentEarning[] = [agentEarning]

    if (uplineIds[0]) {
      const e1 = await tx.earnings.create({
        data: {
          userId: uplineIds[0],
          projectId,
          bookingId,
          baseAmount: 0,
          slabPct: 0,
          calculatedAmount: 0,
          uplineBonus1: 0,
          uplineBonus2: 0,
          totalAmount: uplineBonus1,
          status: 'PENDING',
          notes: `Upline bonus (L1) for booking ${bookingId ?? 'N/A'}`,
          approvedBy: approvedBy ?? undefined,
        },
      })
      uplineRecords.push(e1)
    }
    if (uplineIds[1]) {
      const e2 = await tx.earnings.create({
        data: {
          userId: uplineIds[1],
          projectId,
          bookingId,
          baseAmount: 0,
          slabPct: 0,
          calculatedAmount: 0,
          uplineBonus1: 0,
          uplineBonus2: 0,
          totalAmount: uplineBonus2,
          status: 'PENDING',
          notes: `Upline bonus (L2) for booking ${bookingId ?? 'N/A'}`,
          approvedBy: approvedBy ?? undefined,
        },
      })
      uplineRecords.push(e2)
    }

    return uplineRecords
  })

  return created
}
