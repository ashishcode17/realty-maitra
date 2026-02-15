/**
 * Deletes ALL user data so you can start fresh (register again, test OTP).
 * Run: npx tsx scripts/deleteAllUserData.ts
 * Uses DATABASE_URL from .env (same as production if you point .env at prod).
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required. Add it to .env')
}

const prisma = new PrismaClient()

async function main() {
  console.log('Deleting all user-related data...')

  await prisma.otpVerification.deleteMany({})
  console.log('  OtpVerification: cleared')

  await prisma.auditLog.deleteMany({})
  console.log('  AuditLog: cleared')

  await prisma.notification.deleteMany({})
  console.log('  Notification: cleared')

  await prisma.fileDownloadLog.deleteMany({})
  console.log('  FileDownloadLog: cleared')

  await prisma.trainingCompletion.deleteMany({})
  await prisma.trainingBooking.deleteMany({})
  await prisma.challengeEnrollment.deleteMany({})
  await prisma.earnings.deleteMany({})
  console.log('  Training/Earnings/Challenge: cleared')

  await prisma.lead.updateMany({ data: { assignedToUserId: null } })
  console.log('  Lead assignees: cleared')

  await prisma.supportTicket.deleteMany({})
  console.log('  SupportTicket: cleared')

  const slots = await prisma.trainingSlot.findMany({ select: { id: true } })
  if (slots.length > 0) {
    await prisma.trainingBooking.deleteMany({ where: { slotId: { in: slots.map((s) => s.id) } } })
    await prisma.trainingSlot.deleteMany({})
  }
  await prisma.trainingSession.deleteMany({})
  console.log('  TrainingSession/Slot: cleared')

  await prisma.trainingContent.updateMany({ data: { createdById: null } })
  await prisma.offerChallenge.deleteMany({})
  await prisma.project.updateMany({ data: { createdById: null } })
  console.log('  Projects/Challenges/Content: cleared')

  await prisma.userSettings.deleteMany({})
  await prisma.userSession.deleteMany({})
  console.log('  UserSettings/UserSession: cleared')

  await prisma.user.updateMany({ data: { sponsorId: null } })
  const deleted = await prisma.user.deleteMany({})
  console.log('  User: deleted', deleted.count, 'users')

  console.log('Done. You can register again from scratch.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
