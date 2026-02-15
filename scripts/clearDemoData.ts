/**
 * Removes all demo data (isDemo = true) from the database.
 * Keeps your real/admin users and any non-demo data.
 * Run from project root: npm run clear:demo
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required. Add it to .env')
}

const prisma = new PrismaClient()

async function clearDemoData() {
  console.log('🧹 Clearing demo data...')

  // Order: delete child records first (they reference parent tables)
  const deleted = {
    trainingCompletions: await prisma.trainingCompletion.deleteMany({ where: { isDemo: true } }),
    challengeEnrollments: await prisma.challengeEnrollment.deleteMany({ where: { isDemo: true } }),
    trainingBookings: await prisma.trainingBooking.deleteMany({ where: { isDemo: true } }),
    fileDownloadLogs: await prisma.fileDownloadLog.deleteMany({ where: { isDemo: true } }),
    notifications: await prisma.notification.deleteMany({ where: { isDemo: true } }),
    earnings: await prisma.earnings.deleteMany({ where: { isDemo: true } }),
  }
  console.log('  Training completions:', deleted.trainingCompletions.count)
  console.log('  Challenge enrollments:', deleted.challengeEnrollments.count)
  console.log('  Training bookings:', deleted.trainingBookings.count)
  console.log('  File download logs:', deleted.fileDownloadLogs.count)
  console.log('  Notifications:', deleted.notifications.count)
  console.log('  Earnings:', deleted.earnings.count)

  const slots = await prisma.trainingSlot.findMany({ where: { isDemo: true }, select: { id: true } })
  if (slots.length > 0) {
    await prisma.trainingBooking.deleteMany({ where: { slotId: { in: slots.map((s) => s.id) } } })
    await prisma.trainingSlot.deleteMany({ where: { isDemo: true } })
    console.log('  Training slots:', slots.length)
  }

  await prisma.trainingSession.deleteMany({ where: { isDemo: true } })
  console.log('  Training sessions (demo) removed')

  await prisma.projectDocument.deleteMany({ where: { isDemo: true } })
  await prisma.slabConfig.deleteMany({ where: { isDemo: true } })
  await prisma.offerChallenge.deleteMany({ where: { isDemo: true } })
  await prisma.trainingContent.deleteMany({ where: { isDemo: true } })
  await prisma.earnings.deleteMany({ where: { isDemo: true } }) // in case project earnings
  await prisma.project.deleteMany({ where: { isDemo: true } })
  console.log('  Projects, training content, offers (demo) removed')

  // Demo users: delete from leaves up (users who are not sponsors of any demo user)
  let totalUsersDeleted = 0
  for (let round = 0; round < 100; round++) {
    const demoUsers = await prisma.user.findMany({
      where: { isDemo: true },
      select: { id: true },
    })
    if (demoUsers.length === 0) break
    const demoIds = new Set(demoUsers.map((u) => u.id))
    const sponsorsOfDemo = await prisma.user.findMany({
      where: { sponsorId: { in: [...demoIds] } },
      select: { sponsorId: true },
    })
    const sponsorIds = new Set(sponsorsOfDemo.map((s) => s.sponsorId).filter(Boolean))
    const leafDemoIds = demoUsers.filter((u) => !sponsorIds.has(u.id)).map((u) => u.id)
    if (leafDemoIds.length === 0) {
      console.warn('  Demo user cycle detected; breaking.')
      break
    }
    // Delete related records for these users first
    await prisma.userSettings.deleteMany({ where: { userId: { in: leafDemoIds } } })
    await prisma.userSession.deleteMany({ where: { userId: { in: leafDemoIds } } })
    await prisma.supportTicket.deleteMany({ where: { userId: { in: leafDemoIds } } })
    await prisma.auditLog.deleteMany({ where: { actorUserId: { in: leafDemoIds } } })
    await prisma.trainingCompletion.deleteMany({ where: { userId: { in: leafDemoIds } } })
    await prisma.trainingBooking.deleteMany({ where: { userId: { in: leafDemoIds } } })
    await prisma.challengeEnrollment.deleteMany({ where: { userId: { in: leafDemoIds } } })
    await prisma.fileDownloadLog.deleteMany({ where: { userId: { in: leafDemoIds } } })
    await prisma.notification.deleteMany({ where: { targetUserId: { in: leafDemoIds } } })
    await prisma.earnings.deleteMany({ where: { userId: { in: leafDemoIds } } })
    await prisma.lead.updateMany({ where: { assignedToUserId: { in: leafDemoIds } }, data: { assignedToUserId: null } })
    await prisma.user.deleteMany({ where: { id: { in: leafDemoIds } } })
    totalUsersDeleted += leafDemoIds.length
  }
  console.log('  Demo users removed:', totalUsersDeleted)

  console.log('✅ Demo data cleared.')
}

clearDemoData()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
