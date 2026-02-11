import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'

// Ensure DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required. Make sure .env file exists and contains DATABASE_URL.')
}

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const adminPassword = bcrypt.hashSync('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@realtycollective.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@realtycollective.com',
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
  console.log('✅ Created admin user:', admin.email)

    // Create a director (sponsor)
    const directorPassword = bcrypt.hashSync('director123', 10)
    const director = await prisma.user.upsert({
      where: { email: 'director@realtycollective.com' },
      update: {},
      create: {
        name: 'John Director',
        email: 'director@realtycollective.com',
        phone: '+91-9876543210',
        city: 'Mumbai',
        passwordHash: directorPassword,
        role: 'DIRECTOR',
        roleRank: 6,
        status: 'ACTIVE',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        sponsorId: admin.id,
        sponsorCode: 'DEMO1234',
        path: [admin.id],
        lastActive: new Date(),
      },
    })
  console.log('✅ Created director:', director.email)

    // Create a VP under director
    const vpPassword = bcrypt.hashSync('vp123', 10)
    const vp = await prisma.user.upsert({
      where: { email: 'vp@realtycollective.com' },
      update: {},
      create: {
        name: 'Jane VP',
        email: 'vp@realtycollective.com',
        phone: '+91-9876543211',
        city: 'Delhi',
        passwordHash: vpPassword,
        role: 'VP',
        roleRank: 5,
        status: 'ACTIVE',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        sponsorId: director.id,
        sponsorCode: 'VP001',
        path: [admin.id, director.id],
        lastActive: new Date(),
      },
    })
  console.log('✅ Created VP:', vp.email)

  // Create projects
  const project1 = await prisma.project.create({
    data: {
      name: 'Atmosphere Rishikesh',
      location: 'Rishikesh, Uttarakhand',
      type: 'VILLAS',
      status: 'ACTIVE',
      description: 'Premium villas with mountain views in Rishikesh',
      media: ['https://via.placeholder.com/800x600?text=Atmosphere+Rishikesh'],
      documents: [],
      createdById: admin.id,
    },
  })
  console.log('✅ Created project:', project1.name)

  const project2 = await prisma.project.create({
    data: {
      name: 'Anandam Valley',
      location: 'Uttar Pradesh',
      type: 'PLOTS',
      status: 'UPCOMING',
      description: 'Residential plots in prime location',
      media: ['https://via.placeholder.com/800x600?text=Anandam+Valley'],
      documents: [],
      createdById: admin.id,
    },
  })
  console.log('✅ Created project:', project2.name)

  // Create slab configs
  await prisma.slabConfig.create({
    data: {
      projectId: project1.id,
      directorPct: 100,
      vpPct: 90,
      avpPct: 80,
      ssmPct: 70,
      smPct: 60,
      bdmPct: 40,
      uplineBonus1Pct: 5,
      uplineBonus2Pct: 5,
    },
  })

  await prisma.slabConfig.create({
    data: {
      projectId: project2.id,
      directorPct: 100,
      vpPct: 90,
      avpPct: 80,
      ssmPct: 70,
      smPct: 60,
      bdmPct: 40,
      uplineBonus1Pct: 5,
      uplineBonus2Pct: 5,
    },
  })
  console.log('✅ Created slab configurations')

  // Create training content
  // Note: For MVP, we'll create content without files
  // In production, you would upload actual files first
  await prisma.trainingContent.create({
    data: {
      title: 'Welcome to Realty Maitra',
      category: 'ONBOARDING',
      type: 'VIDEO',
      videoEmbedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      description: 'Introduction to the platform and how to get started',
      isActive: true,
      createdById: admin.id,
      uploadedBy: admin.id,
      uploadedAt: new Date(),
    },
  })

  // Create a placeholder PDF training content
  // In production, admin would upload actual PDF file
  await prisma.trainingContent.create({
    data: {
      title: 'Sales Techniques for Real Estate',
      category: 'SALES',
      type: 'PDF',
      description: 'Comprehensive guide to real estate sales',
      isActive: true,
      createdById: admin.id,
      uploadedBy: admin.id,
      uploadedAt: new Date(),
      // filePath, fileName, etc. will be set when admin uploads actual file
    },
  })
  console.log('✅ Created training content')

  // Create training sessions
  await prisma.trainingSession.create({
    data: {
      title: 'Monthly Sales Training',
      mode: 'ONLINE',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      description: 'Monthly training session covering latest sales techniques',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      slotCapacity: 50,
      isActive: true,
      createdById: admin.id,
    },
  })

  await prisma.trainingSession.create({
    data: {
      title: 'Project Deep Dive: Atmosphere Rishikesh',
      mode: 'OFFLINE',
      location: 'Mumbai Office',
      description: 'Detailed walkthrough of Atmosphere Rishikesh project',
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      slotCapacity: 30,
      isActive: true,
      createdById: admin.id,
    },
  })
  console.log('✅ Created training sessions')

  // Create challenges
  await prisma.offerChallenge.create({
    data: {
      title: 'Q1 Booking Challenge',
      reward: 'iPhone 15 Pro + Recognition Badge',
      requirementsJson: JSON.stringify({
        bookings: 5,
        meetings: 10,
        training: 3,
      }),
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      isActive: true,
      visibility: 'ALL',
      createdById: admin.id,
    },
  })

  await prisma.offerChallenge.create({
    data: {
      title: 'Network Growth Challenge',
      reward: '₹50,000 Bonus + Trip',
      requirementsJson: JSON.stringify({
        directDownlines: 10,
        totalNetwork: 50,
      }),
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      isActive: true,
      visibility: 'ALL',
      createdById: admin.id,
    },
  })
  console.log('✅ Created challenges')

  // Create notifications
  await prisma.notification.create({
    data: {
      title: 'New Project Launch: Atmosphere Rishikesh',
      body: 'Check out our latest project with premium villas and mountain views',
      type: 'INFO',
      priority: 'HIGH',
      isActive: true,
      isGlobal: true,
      link: '/projects',
      createdById: admin.id,
    },
  })

  await prisma.notification.create({
    data: {
      title: 'Training Session Reminder',
      body: 'Monthly sales training session is scheduled for next week',
      type: 'INFO',
      priority: 'MEDIUM',
      isActive: true,
      isGlobal: true,
      link: '/training',
      createdById: admin.id,
    },
  })
  console.log('✅ Created notifications')

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
