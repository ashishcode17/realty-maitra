import 'dotenv/config'
import { PrismaClient, UserRole, TrainingContentCategory, TrainingContentType } from '@prisma/client'
import bcrypt from 'bcryptjs'
import fs from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { getDemoAssets } from './demoAssetsManifest'

const prisma = new PrismaClient()

const ROOT_DIR = process.cwd()
const ASSETS_DIR = path.join(ROOT_DIR, 'scripts', 'demo_assets')
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads')

const UPLOAD_DIRS = {
  training: path.join(UPLOADS_DIR, 'training'),
  projects: path.join(UPLOADS_DIR, 'projects'),
  offers: path.join(UPLOADS_DIR, 'offers'),
} as const

const MIME_BY_EXT: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.png': 'image/png',
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000)
}

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function ensureDirs() {
  await fs.mkdir(ASSETS_DIR, { recursive: true })
  await fs.mkdir(UPLOAD_DIRS.training, { recursive: true })
  await fs.mkdir(UPLOAD_DIRS.projects, { recursive: true })
  await fs.mkdir(UPLOAD_DIRS.offers, { recursive: true })
}

async function ensureDemoAssetsExist() {
  await ensureDirs()
  const assets = getDemoAssets()
  for (const asset of assets) {
    const outPath = path.join(ASSETS_DIR, asset.relativePath)
    await fs.mkdir(path.dirname(outPath), { recursive: true })
    try {
      await fs.access(outPath)
      // exists
    } catch {
      const buf = Buffer.from(asset.bytesBase64, 'base64')
      await fs.writeFile(outPath, buf)
    }
  }
}

async function copyAssetToUploads(args: {
  assetRelativePath: string // in scripts/demo_assets/*
  destBucket: keyof typeof UPLOAD_DIRS
  prefix: string // e.g., "demo"
}): Promise<{ filePath: string; originalName: string; mimeType: string; size: number }> {
  const srcPath = path.join(ASSETS_DIR, args.assetRelativePath)
  const originalName = path.basename(srcPath)
  const ext = path.extname(originalName).toLowerCase()
  const mimeType = MIME_BY_EXT[ext] || 'application/octet-stream'
  const destName = `${args.prefix}-${randomUUID()}${ext}`
  const destPath = path.join(UPLOAD_DIRS[args.destBucket], destName)
  await fs.copyFile(srcPath, destPath)
  const stat = await fs.stat(destPath)
  return {
    filePath: `/uploads/${args.destBucket}/${destName}`,
    originalName,
    mimeType,
    size: stat.size,
  }
}

async function wipeDemoData() {
  // Delete children first (FK constraints)
  await prisma.fileDownloadLog.deleteMany({ where: { isDemo: true } })
  await prisma.trainingCompletion.deleteMany({ where: { isDemo: true } })
  await prisma.challengeEnrollment.deleteMany({ where: { isDemo: true } })
  await prisma.trainingBooking.deleteMany({ where: { isDemo: true } })
  await prisma.trainingSlot.deleteMany({ where: { isDemo: true } })
  await prisma.trainingSession.deleteMany({ where: { isDemo: true } })
  await prisma.earnings.deleteMany({ where: { isDemo: true } })
  await prisma.projectDocument.deleteMany({ where: { isDemo: true } })
  await prisma.trainingContent.deleteMany({ where: { isDemo: true } })
  await prisma.offerChallenge.deleteMany({ where: { isDemo: true } })
  await prisma.notification.deleteMany({ where: { isDemo: true } })
  await prisma.slabConfig.deleteMany({ where: { isDemo: true } })
  await prisma.project.deleteMany({ where: { isDemo: true } })
  await prisma.user.deleteMany({ where: { isDemo: true } })

  // Optional: remove demo files from uploads (only files starting with demo-)
  for (const bucket of Object.keys(UPLOAD_DIRS) as (keyof typeof UPLOAD_DIRS)[]) {
    const dir = UPLOAD_DIRS[bucket]
    const files = await fs.readdir(dir).catch(() => [])
    await Promise.all(
      files
        .filter((f) => f.startsWith('demo-'))
        .map((f) => fs.unlink(path.join(dir, f)).catch(() => {}))
    )
  }
}

function roleRank(role: UserRole) {
  switch (role) {
    case 'DIRECTOR':
      return 1
    case 'VP':
      return 2
    case 'AVP':
      return 3
    case 'SSM':
      return 4
    case 'SM':
      return 5
    case 'BDM':
      return 6
    case 'ADMIN':
      return 90
    case 'SUPER_ADMIN':
      return 100
    default:
      return 6
  }
}

async function createUser(args: {
  name: string
  email: string
  role: UserRole
  sponsorId?: string | null
  path: string[]
  city: string
  createdAt: Date
  password: string
  sponsorCode: string
}) {
  return prisma.user.create({
    data: {
      name: args.name,
      email: args.email,
      city: args.city,
      passwordHash: bcrypt.hashSync(args.password, 10),
      role: args.role,
      roleRank: roleRank(args.role),
      status: 'ACTIVE',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      sponsorId: args.sponsorId ?? null,
      path: args.path,
      sponsorCode: args.sponsorCode,
      lastActive: daysAgo(randInt(0, 30)),
      createdAt: args.createdAt,
      isDemo: true,
    },
  })
}

async function seedTree(admin: { id: string }) {
  const cities = ['Noida', 'Delhi', 'Gurugram', 'Lucknow', 'Jaipur', 'Pune', 'Mumbai', 'Hyderabad']
  const password = 'demo123'

  const ssmUsers = []
  for (let i = 1; i <= 5; i++) {
    const createdAt = daysAgo(randInt(1, 90))
    const ssm = await createUser({
      name: `SSM-${i}`,
      email: `ssm${i}@demo.realtycollective.com`,
      role: 'SSM',
      sponsorId: admin.id,
      path: [admin.id],
      city: pick(cities),
      createdAt,
      password,
      sponsorCode: `DEMO-SSM${i}`,
    })
    ssmUsers.push(ssm)

    const sm = await createUser({
      name: `SM-${i}`,
      email: `sm${i}@demo.realtycollective.com`,
      role: 'SM',
      sponsorId: ssm.id,
      path: [admin.id, ssm.id],
      city: pick(cities),
      createdAt: daysAgo(randInt(1, 90)),
      password,
      sponsorCode: `DEMO-SM${i}`,
    })

    const bdmGroupSizes = [2, 5, 1, 4, 3, 2]
    for (let b = 1; b <= 6; b++) {
      const bdm = await createUser({
        name: `BDM-${i}-${b}`,
        email: `bdm${i}-${b}@demo.realtycollective.com`,
        role: 'BDM',
        sponsorId: sm.id,
        path: [admin.id, ssm.id, sm.id],
        city: pick(cities),
        createdAt: daysAgo(randInt(1, 90)),
        password,
        sponsorCode: `DEMO-BDM${i}${b}`,
      })

      // Sub-BDM team under each BDM with varying sizes
      const subCount = bdmGroupSizes[b - 1]
      for (let s = 1; s <= subCount; s++) {
        const sub = await createUser({
          name: `BDM-${i}-${b}-SUB-${s}`,
          email: `bdm${i}-${b}-sub${s}@demo.realtycollective.com`,
          role: 'BDM',
          sponsorId: bdm.id,
          path: [admin.id, ssm.id, sm.id, bdm.id],
          city: pick(cities),
          createdAt: daysAgo(randInt(1, 90)),
          password,
          sponsorCode: `DEMO-SUB${i}${b}${s}`,
        })

        // Add depth 4-5: each sub has 1–3 more members; some are leaf nodes.
        const depthChildren = randInt(1, 3)
        for (let d = 1; d <= depthChildren; d++) {
          const child = await createUser({
            name: `Member-${i}-${b}-${s}-${d}`,
            email: `m${i}-${b}-${s}-${d}@demo.realtycollective.com`,
            role: 'BDM',
            sponsorId: sub.id,
            path: [admin.id, ssm.id, sm.id, bdm.id, sub.id],
            city: pick(cities),
            createdAt: daysAgo(randInt(1, 90)),
            password,
            sponsorCode: `DEMO-M${i}${b}${s}${d}`,
          })

          // Occasionally add one more level
          if (Math.random() < 0.4) {
            await createUser({
              name: `Member-${i}-${b}-${s}-${d}-A`,
              email: `m${i}-${b}-${s}-${d}-a@demo.realtycollective.com`,
              role: 'BDM',
              sponsorId: child.id,
              path: [admin.id, ssm.id, sm.id, bdm.id, sub.id, child.id],
              city: pick(cities),
              createdAt: daysAgo(randInt(1, 90)),
              password,
              sponsorCode: `DEMO-MA${i}${b}${s}${d}`,
            })
          }
        }
      }
    }
  }

  return { ssmUsers }
}

async function seedProjects(admin: { id: string }) {
  const projectDefs = [
    {
      name: 'Skyline Residency',
      location: 'Noida',
      type: 'APARTMENTS' as const,
      status: 'ACTIVE' as const,
      description: 'Premium high-rise apartments with modern amenities.',
      imgAsset: 'projects/project-image-1.png',
      pdfAsset: 'projects/project-doc-1.pdf',
    },
    {
      name: 'Green Acres Villas',
      location: 'Gurugram',
      type: 'VILLAS' as const,
      status: 'UPCOMING' as const,
      description: 'Luxury villas in a gated community with green landscapes.',
      imgAsset: 'projects/project-image-2.png',
      pdfAsset: 'projects/project-doc-2.pdf',
    },
    {
      name: 'Metro Plaza',
      location: 'Delhi',
      type: 'COMMERCIAL' as const,
      status: 'ACTIVE' as const,
      description: 'A commercial hub near metro connectivity for business growth.',
      imgAsset: 'projects/project-image-3.png',
      pdfAsset: 'projects/project-doc-3.pdf',
    },
    {
      name: 'Riverfront Plots',
      location: 'Lucknow',
      type: 'PLOTS' as const,
      status: 'CLOSED' as const,
      description: 'A completed plotted development with strong resale demand.',
      imgAsset: 'projects/project-image-4.png',
      pdfAsset: 'projects/project-doc-4.pdf',
    },
  ]

  const projects = []
  for (const def of projectDefs) {
    const img = await copyAssetToUploads({ assetRelativePath: def.imgAsset, destBucket: 'projects', prefix: 'demo' })
    const doc = await copyAssetToUploads({ assetRelativePath: def.pdfAsset, destBucket: 'projects', prefix: 'demo' })

    const project = await prisma.project.create({
      data: {
        name: def.name,
        location: def.location,
        type: def.type,
        status: def.status,
        description: def.description,
        media: [img.filePath],
        documents: [],
        createdById: admin.id,
        isDemo: true,
      },
    })

    await prisma.projectDocument.create({
      data: {
        projectId: project.id,
        filePath: doc.filePath,
        fileName: doc.originalName,
        fileType: doc.mimeType,
        fileSize: doc.size,
        uploadedBy: admin.id,
        uploadedAt: new Date(),
        isDemo: true,
      },
    })

    await prisma.slabConfig.create({
      data: {
        projectId: project.id,
        directorPct: 100,
        vpPct: 90,
        avpPct: 80,
        ssmPct: 70,
        smPct: 60,
        bdmPct: 40,
        uplineBonus1Pct: 5,
        uplineBonus2Pct: 5,
        isDemo: true,
      },
    })

    projects.push(project)
  }
  return projects
}

async function seedTraining(admin: { id: string }, projects: { id: string; name: string }[], allDemoUsers: { id: string; role: UserRole }[]) {
  const categories: TrainingContentCategory[] = ['ONBOARDING', 'SALES', 'PROJECTS', 'COMPLIANCE', 'SCRIPTS', 'TOOLS']

  // 12 PDFs
  const pdfItems = []
  for (let i = 1; i <= 12; i++) {
    const file = await copyAssetToUploads({
      assetRelativePath: `training/training-${String(i).padStart(2, '0')}.pdf`,
      destBucket: 'training',
      prefix: 'demo',
    })
    pdfItems.push(
      await prisma.trainingContent.create({
        data: {
          title: `Training PDF ${i}: ${pick(['Basics', 'Advanced', 'Playbook', 'Checklist'])}`,
          category: pick(categories),
          type: 'PDF',
          filePath: file.filePath,
          fileName: file.originalName,
          fileType: file.mimeType,
          fileSize: file.size,
          description: 'Demo PDF training material (stored locally).',
          projectId: Math.random() < 0.35 ? pick(projects).id : null,
          roleVisibility: [],
          isActive: true,
          createdById: admin.id,
          uploadedBy: admin.id,
          uploadedAt: new Date(),
          isDemo: true,
        },
      })
    )
  }

  // 8 documents/notes
  const docItems = []
  for (let i = 1; i <= 8; i++) {
    const file = await copyAssetToUploads({
      assetRelativePath: `training/notes-${String(i).padStart(2, '0')}.docx`,
      destBucket: 'training',
      prefix: 'demo',
    })
    docItems.push(
      await prisma.trainingContent.create({
        data: {
          title: `Notes ${i}: ${pick(['Scripts', 'Objection Handling', 'Compliance', 'Tools'])}`,
          category: pick(categories),
          type: 'DOCX' as TrainingContentType,
          filePath: file.filePath,
          fileName: file.originalName,
          fileType: file.mimeType,
          fileSize: file.size,
          description: 'Demo document/notes (stored locally).',
          projectId: Math.random() < 0.25 ? pick(projects).id : null,
          roleVisibility: [],
          isActive: true,
          createdById: admin.id,
          uploadedBy: admin.id,
          uploadedAt: new Date(),
          isDemo: true,
        },
      })
    )
  }

  // 10 videos
  const videoEmbeds = [
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    'https://www.youtube.com/embed/ysz5S6PUM-U',
    'https://www.youtube.com/embed/aqz-KE-bpKQ',
    'https://www.youtube.com/embed/tgbNymZ7vqY',
  ]
  const videoItems = []
  for (let i = 1; i <= 10; i++) {
    videoItems.push(
      await prisma.trainingContent.create({
        data: {
          title: `Video ${i}: ${pick(['Sales Walkthrough', 'Project Pitch', 'Negotiation', 'CRM'])}`,
          category: pick(categories),
          type: 'VIDEO',
          videoEmbedUrl: pick(videoEmbeds),
          description: 'Demo video (embed only).',
          projectId: Math.random() < 0.3 ? pick(projects).id : null,
          roleVisibility: [],
          isActive: true,
          createdById: admin.id,
          uploadedBy: admin.id,
          uploadedAt: new Date(),
          isDemo: true,
        },
      })
    )
  }

  const allContent = [...pdfItems, ...docItems, ...videoItems]

  // Completion tracking: 30–70% completion randomly for a subset of users
  const eligibleUsers = allDemoUsers.filter((u) => u.role !== 'SUPER_ADMIN' && u.role !== 'ADMIN')
  for (const user of eligibleUsers.slice(0, 30)) {
    const completionPct = randInt(30, 70)
    const toComplete = Math.floor((completionPct / 100) * allContent.length)
    const shuffled = [...allContent].sort(() => Math.random() - 0.5).slice(0, toComplete)
    for (const content of shuffled) {
      if (!content.filePath && content.type !== 'VIDEO') continue
      await prisma.trainingCompletion
        .create({
          data: {
            userId: user.id,
            contentId: content.id,
            completedAt: daysAgo(randInt(0, 60)),
            isDemo: true,
          },
        })
        .catch(() => {})
    }
  }

  return allContent
}

async function seedTrainingSessions(admin: { id: string }, users: { id: string }[]) {
  const sessions = []
  for (let i = 1; i <= 6; i++) {
    const startInDays = randInt(1, 14)
    const startDate = new Date(Date.now() + startInDays * 24 * 60 * 60 * 1000)
    const isOnline = Math.random() < 0.5
    const session = await prisma.trainingSession.create({
      data: {
        title: `${pick(['Sales Masterclass', 'Project Deep Dive', 'Compliance Clinic', 'Tooling Workshop'])} #${i}`,
        mode: isOnline ? 'ONLINE' : 'OFFLINE',
        meetingLink: isOnline ? 'https://meet.google.com/demo-meet-link' : null,
        location: isOnline ? null : pick(['Delhi Office', 'Noida Hub', 'Gurugram Center']),
        description: 'Demo training session with multiple slots.',
        startDate,
        endDate: new Date(startDate.getTime() + 2 * 60 * 60 * 1000),
        slotCapacity: 50,
        isActive: true,
        createdById: admin.id,
        isDemo: true,
      },
    })

    // 3 slots
    for (let s = 1; s <= 3; s++) {
      const slotStart = new Date(startDate.getTime() + (s - 1) * 60 * 60 * 1000)
      const slotEnd = new Date(slotStart.getTime() + 45 * 60 * 1000)
      const capacity = randInt(10, 30)
      const slot = await prisma.trainingSlot.create({
        data: {
          sessionId: session.id,
          title: `Slot ${s}`,
          startTime: slotStart,
          endTime: slotEnd,
          capacity,
          isDemo: true,
        },
      })

      // Seed a few bookings
      const bookCount = randInt(0, Math.min(capacity, 8))
      const shuffledUsers = [...users].sort(() => Math.random() - 0.5).slice(0, bookCount)
      for (const u of shuffledUsers) {
        await prisma.trainingBooking
          .create({
            data: {
              sessionId: session.id,
              slotId: slot.id,
              userId: u.id,
              status: 'CONFIRMED',
              isDemo: true,
            },
          })
          .catch(() => {})
      }
    }

    sessions.push(session)
  }
  return sessions
}

async function seedOffers(admin: { id: string }, users: { id: string }[]) {
  const offers = []
  for (let i = 1; i <= 8; i++) {
    const banner = await copyAssetToUploads({
      assetRelativePath: `offers/offer-banner-${i}.png`,
      destBucket: 'offers',
      prefix: 'demo',
    })

    const startDate = daysAgo(randInt(0, 10))
    const endDate = new Date(Date.now() + randInt(10, 40) * 24 * 60 * 60 * 1000)
    const req = {
      meetings: randInt(3, 15),
      bookings: randInt(1, 8),
      trainingCompletion: randInt(20, 80),
    }

    const offer = await prisma.offerChallenge.create({
      data: {
        title: `${pick(['Mega Bonus', 'Weekend Sprint', 'Super Seller', 'Network Builder'])} ${i}`,
        reward: pick(['₹25,000 Bonus', 'iPad', 'Dubai Trip', 'iPhone', '₹10,000 Voucher']),
        requirementsJson: JSON.stringify(req),
        bannerFilePath: banner.filePath,
        bannerFileName: banner.originalName,
        bannerFileType: banner.mimeType,
        bannerFileSize: banner.size,
        startDate,
        endDate,
        isActive: true,
        visibility: 'ALL',
        createdById: admin.id,
        isDemo: true,
      },
    })
    offers.push(offer)
  }

  // Wall of challengers: enroll 30 random users with progress mix
  const progressMix = [0, 15, 40, 70, 100]
  const randomUsers = [...users].sort(() => Math.random() - 0.5).slice(0, 30)
  for (const u of randomUsers) {
    const ch = pick(offers)
    const pct = pick(progressMix)
    const completed = pct === 100
    await prisma.challengeEnrollment
      .create({
        data: {
          challengeId: ch.id,
          userId: u.id,
          status: completed ? 'COMPLETED' : 'ACTIVE',
          progressJson: JSON.stringify({ percent: pct }),
          enrolledAt: daysAgo(randInt(0, 20)),
          completedAt: completed ? daysAgo(randInt(0, 5)) : null,
          notes: completed ? 'Featured finisher' : null,
          isDemo: true,
        },
      })
      .catch(() => {})
  }

  return offers
}

async function seedNotices(admin: { id: string }) {
  const notices = [
    { title: 'New Project Launch', body: 'A new project is live. Check Projects module.', link: '/projects' },
    { title: 'Training Schedule Updated', body: 'New sessions added for next 2 weeks.', link: '/training' },
    { title: 'New Offer Unlocked', body: 'Limited-time rewards are available now.', link: '/offers' },
    { title: 'System Update', body: 'Minor UI improvements and stability updates.', link: '/dashboard' },
    { title: 'Compliance Reminder', body: 'Please review compliance training this week.', link: '/training' },
    { title: 'Top Performers', body: 'Congrats to this week’s top challengers.', link: '/offers' },
    { title: 'Project Deep Dive', body: 'Join upcoming project walkthrough session.', link: '/training' },
    { title: 'Sales Scripts Added', body: 'New scripts available in Training Center.', link: '/training' },
    { title: 'Weekend Sprint', body: 'Complete tasks to win bonus rewards.', link: '/offers' },
    { title: 'Hot Notice', body: 'Demo mode enabled: explore all modules safely.', link: '/dashboard' },
  ]

  for (const n of notices) {
    await prisma.notification.create({
      data: {
        title: n.title,
        body: n.body,
        type: 'INFO',
        priority: 'MEDIUM',
        link: n.link,
        isActive: true,
        isGlobal: true,
        createdById: admin.id,
        isDemo: true,
      },
    })
  }
}

async function seedEarnings(projects: { id: string }[], usersById: Map<string, any>, realAdminId: string) {
  const allUsers = Array.from(usersById.values()).filter((u) => u.role !== 'SUPER_ADMIN' && u.role !== 'ADMIN')
  for (let i = 0; i < 50; i++) {
    const user = pick(allUsers)
    const project = pick(projects)
    const baseAmount = randInt(200000, 2500000) // ₹2L to ₹25L

    const slabPct =
      user.role === 'DIRECTOR'
        ? 100
        : user.role === 'VP'
          ? 90
          : user.role === 'AVP'
            ? 80
            : user.role === 'SSM'
              ? 70
              : user.role === 'SM'
                ? 60
                : 40

    const calculatedAmount = (baseAmount * slabPct) / 100
    const uplineBonus1Amount = user.role === 'BDM' ? (baseAmount * 5) / 100 : 0
    const uplineBonus2Amount = user.role === 'BDM' ? (baseAmount * 5) / 100 : 0
    const totalAmount = calculatedAmount + uplineBonus1Amount + uplineBonus2Amount
    const status = pick(['PENDING', 'APPROVED', 'PAID'] as const)
    const createdAt = daysAgo(randInt(0, 60))

    // Main earning row for the deal owner (BDM/SM/SSM etc.)
    await prisma.earnings.create({
      data: {
        userId: user.id,
        projectId: project.id,
        bookingId: `DEMO-DEAL-${i + 1}`,
        baseAmount,
        slabPct,
        calculatedAmount,
        uplineBonus1: uplineBonus1Amount,
        uplineBonus2: uplineBonus2Amount,
        totalAmount,
        status,
        notes: 'Demo earnings entry',
        createdAt,
        approvedBy: status !== 'PENDING' ? user.id : null,
        paidAt: status === 'PAID' ? daysAgo(randInt(0, 20)) : null,
        isDemo: true,
      },
    })

    // For BDM deals: create separate earning rows for the two uplines so they see income
    if (user.role === 'BDM' && user.sponsorId) {
      const upline1 = usersById.get(user.sponsorId)
      if (upline1) {
        await prisma.earnings.create({
          data: {
            userId: upline1.id,
            projectId: project.id,
            bookingId: `DEMO-DEAL-${i + 1}`,
            baseAmount,
            slabPct: 0,
            calculatedAmount: 0,
            uplineBonus1: uplineBonus1Amount,
            uplineBonus2: 0,
            totalAmount: uplineBonus1Amount,
            status,
            notes: `Upline bonus (from BDM deal DEMO-DEAL-${i + 1})`,
            createdAt,
            approvedBy: status !== 'PENDING' ? upline1.id : null,
            paidAt: status === 'PAID' ? daysAgo(randInt(0, 20)) : null,
            isDemo: true,
          },
        })

        if (upline1.sponsorId) {
          const upline2 = usersById.get(upline1.sponsorId)
          if (upline2) {
            await prisma.earnings.create({
              data: {
                userId: upline2.id,
                projectId: project.id,
                bookingId: `DEMO-DEAL-${i + 1}`,
                baseAmount,
                slabPct: 0,
                calculatedAmount: 0,
                uplineBonus1: 0,
                uplineBonus2: uplineBonus2Amount,
                totalAmount: uplineBonus2Amount,
                status,
                notes: `Upline bonus (from BDM deal DEMO-DEAL-${i + 1})`,
                createdAt,
                approvedBy: status !== 'PENDING' ? upline2.id : null,
                paidAt: status === 'PAID' ? daysAgo(randInt(0, 20)) : null,
                isDemo: true,
              },
            })
          }
        }
      }
    }
  }

  // Give real admin a few earnings so dashboard shows income (upline/platform bonus from demo)
  for (let i = 0; i < 8; i++) {
    const project = pick(projects)
    const baseAmount = randInt(50000, 200000)
    const bonusAmount = (baseAmount * 5) / 100
    const status = pick(['PENDING', 'APPROVED', 'PAID'] as const)
    await prisma.earnings.create({
      data: {
        userId: realAdminId,
        projectId: project.id,
        bookingId: `DEMO-ADMIN-BONUS-${i + 1}`,
        baseAmount,
        slabPct: 0,
        calculatedAmount: 0,
        uplineBonus1: 0,
        uplineBonus2: bonusAmount,
        totalAmount: bonusAmount,
        status,
        notes: 'Demo admin upline/platform bonus',
        createdAt: daysAgo(randInt(0, 30)),
        approvedBy: status !== 'PENDING' ? realAdminId : null,
        paidAt: status === 'PAID' ? daysAgo(randInt(0, 10)) : null,
        isDemo: true,
      },
    })
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required in .env')
  }

  // Prisma client must include demo models (run npm run db:generate if you changed schema)
  const p = prisma as any
  if (!p.fileDownloadLog || !p.trainingCompletion || !p.trainingSlot) {
    throw new Error(
      'Prisma client is missing demo models. Run: npm run db:generate\nThen run: npm run seed:demo'
    )
  }

  console.log('🧪 Demo seeder: starting...')
  await ensureDemoAssetsExist()
  await wipeDemoData()

  // Ensure a stable real admin exists (not demo)
  const realAdmin = await prisma.user.upsert({
    where: { email: 'admin@realtycollective.com' },
    update: { role: 'SUPER_ADMIN', roleRank: 100, status: 'ACTIVE', emailVerified: true },
    create: {
      name: 'Super Admin',
      email: 'admin@realtycollective.com',
      passwordHash: bcrypt.hashSync('admin123', 10),
      role: 'SUPER_ADMIN',
      roleRank: 100,
      status: 'ACTIVE',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      sponsorCode: 'ADMIN001',
      path: [],
      lastActive: new Date(),
      isDemo: false,
    },
  })

  // Demo admin under real admin so admin@realtycollective.com sees full tree
  const demoAdmin = await prisma.user.create({
    data: {
      name: 'Demo Admin',
      email: 'demo-admin@realtycollective.com',
      passwordHash: bcrypt.hashSync('admin123', 10),
      role: 'SUPER_ADMIN',
      roleRank: 100,
      status: 'ACTIVE',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      sponsorId: realAdmin.id,
      sponsorCode: 'DEMO-ADMIN',
      path: [realAdmin.id],
      lastActive: new Date(),
      isDemo: true,
      createdAt: daysAgo(5),
    },
  })

  console.log('✅ Demo admin created:', demoAdmin.email)

  // Seed tree under demo admin
  await seedTree({ id: demoAdmin.id })

  const allDemoUsers = await prisma.user.findMany({
    where: { isDemo: true },
    select: { id: true, role: true, sponsorId: true },
  })

  const usersById = new Map<string, any>()
  for (const u of allDemoUsers) usersById.set(u.id, u)

  const projects = await seedProjects({ id: demoAdmin.id })
  await seedTraining({ id: demoAdmin.id }, projects, allDemoUsers)
  await seedTrainingSessions({ id: demoAdmin.id }, allDemoUsers.filter((u) => u.role === 'BDM' || u.role === 'SM' || u.role === 'SSM'))
  await seedOffers({ id: demoAdmin.id }, allDemoUsers.filter((u) => u.role !== 'SUPER_ADMIN' && u.role !== 'ADMIN'))
  await seedEarnings(projects, usersById, realAdmin.id)
  await seedNotices({ id: demoAdmin.id })

  console.log('🎉 Demo seeding complete.')
  console.log('')
  console.log('Demo logins:')
  console.log('- Admin (real): admin@realtycollective.com / admin123')
  console.log('- Admin (demo): demo-admin@realtycollective.com / admin123')
  console.log('- User: ssm1@demo.realtycollective.com / demo123')
  console.log('- User: bdm1-1@demo.realtycollective.com / demo123')
  console.log('')
  console.log('Files stored in:')
  console.log('- uploads/training')
  console.log('- uploads/projects')
  console.log('- uploads/offers')
}

main()
  .catch((e) => {
    console.error('❌ Demo seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

