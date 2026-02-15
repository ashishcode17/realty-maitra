/**
 * ONE-TIME: Clears ALL projects, ALL training (content + sessions), and ALL offers
 * so you can fill the app with real data for official launch.
 * Run from project root: npm run clear:launch
 * Uses DATABASE_URL from .env (local or production).
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required. Add it to .env')
}

const prisma = new PrismaClient()

async function clearForLaunch() {
  console.log('Clearing all projects, training, and offers for official launch...\n')

  // 1. Offers (cascade deletes enrollments)
  const offers = await prisma.offerChallenge.deleteMany({})
  console.log('  Offers removed:', offers.count)

  // 2. Training: bookings → slots → sessions, then completions → content
  const bookings = await prisma.trainingBooking.deleteMany({})
  const slots = await prisma.trainingSlot.deleteMany({})
  const sessions = await prisma.trainingSession.deleteMany({})
  const completions = await prisma.trainingCompletion.deleteMany({})
  const content = await prisma.trainingContent.deleteMany({})
  console.log('  Training bookings:', bookings.count)
  console.log('  Training slots:', slots.count)
  console.log('  Training sessions:', sessions.count)
  console.log('  Training completions:', completions.count)
  console.log('  Training content:', content.count)

  // 3. Projects: earnings and lead refs first, then projects
  const earnings = await prisma.earnings.deleteMany({})
  const leadsUpdated = await prisma.lead.updateMany({
    where: { projectInterestId: { not: null } },
    data: { projectInterestId: null },
  })
  const projects = await prisma.project.deleteMany({})
  console.log('  Earnings removed:', earnings.count)
  console.log('  Leads unlinked from projects:', leadsUpdated.count)
  console.log('  Projects removed:', projects.count)

  console.log('\nDone. Projects, Training, and Offers are now empty. You can add real data and launch.')
}

clearForLaunch()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
