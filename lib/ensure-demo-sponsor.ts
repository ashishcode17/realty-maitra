import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { getRoleRank } from '@/lib/roles'

const DEMO_SPONSOR_CODE = 'DEMO1234'
const ADMIN_EMAIL = 'admin@realtycollective.com'
const DIRECTOR_EMAIL = 'director@realtycollective.com'

/**
 * Ensures the demo sponsor (DEMO1234) exists so registration works even if seed never ran.
 * Upserts admin and director with DEMO1234; safe to call on every register with code DEMO1234.
 */
export async function ensureDemoSponsorExists(): Promise<{ id: string; path: string[] } | null> {
  let sponsor = await prisma.user.findFirst({
    where: { sponsorCode: DEMO_SPONSOR_CODE, status: 'ACTIVE' },
    select: { id: true, path: true },
  })
  if (sponsor) return { id: sponsor.id, path: sponsor.path ?? [] }

  const adminPassword = bcrypt.hashSync('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      name: 'Super Admin',
      email: ADMIN_EMAIL,
      passwordHash: adminPassword,
      role: 'SUPER_ADMIN',
      roleRank: 100,
      status: 'ACTIVE',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      sponsorCode: 'ADMIN001',
      path: [],
      lastActive: new Date(),
    },
  })

  const directorPassword = bcrypt.hashSync('director123', 10)
  const director = await prisma.user.upsert({
    where: { email: DIRECTOR_EMAIL },
    update: {},
    create: {
      name: 'John Director',
      email: DIRECTOR_EMAIL,
      phone: '+91-9876543210',
      city: 'Mumbai',
      passwordHash: directorPassword,
      role: 'DIRECTOR',
      roleRank: getRoleRank('DIRECTOR'),
      status: 'ACTIVE',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      sponsorId: admin.id,
      sponsorCode: DEMO_SPONSOR_CODE,
      path: [admin.id],
      lastActive: new Date(),
    },
  })

  return { id: director.id, path: director.path ?? [] }
}
