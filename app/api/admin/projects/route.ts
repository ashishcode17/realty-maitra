import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware'

/** GET: Admin list all projects (any status) */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        slabConfigs: true,
        _count: { select: { leads: true } },
      },
    })

    return NextResponse.json({ projects })
  } catch (error: unknown) {
    console.error('Admin projects list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

/** POST: Admin create project (optional slab) */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    const body = await request.json()
    const {
      name,
      location,
      type,
      status = 'UPCOMING',
      description,
      media = [],
      documents = [],
      slab,
    } = body as {
      name: string
      location: string
      type: string
      status?: string
      description?: string
      media?: string[]
      documents?: string[]
      slab?: {
        directorPct?: number
        vpPct?: number
        avpPct?: number
        ssmPct?: number
        smPct?: number
        bdmPct?: number
        uplineBonus1Pct?: number
        uplineBonus2Pct?: number
      }
    }

    if (!name || !location || !type) {
      return NextResponse.json(
        { error: 'name, location, and type are required' },
        { status: 400 }
      )
    }

    const project = await prisma.project.create({
      data: {
        name,
        location,
        type: type as 'PLOTS' | 'VILLAS' | 'COMMERCIAL' | 'APARTMENTS' | 'MIXED',
        status: (status as 'ACTIVE' | 'UPCOMING' | 'CLOSED') ?? 'UPCOMING',
        description: description ?? null,
        media: media ?? [],
        documents: documents ?? [],
        createdById: admin.userId,
      },
    })

    if (slab && typeof slab === 'object') {
      await prisma.slabConfig.upsert({
        where: { projectId: project.id },
        create: {
          projectId: project.id,
          directorPct: slab.directorPct ?? 100,
          vpPct: slab.vpPct ?? 90,
          avpPct: slab.avpPct ?? 80,
          ssmPct: slab.ssmPct ?? 70,
          smPct: slab.smPct ?? 60,
          bdmPct: slab.bdmPct ?? 40,
          uplineBonus1Pct: slab.uplineBonus1Pct ?? 5,
          uplineBonus2Pct: slab.uplineBonus2Pct ?? 5,
          updatedBy: admin.userId,
        },
        update: {
          directorPct: slab.directorPct ?? 100,
          vpPct: slab.vpPct ?? 90,
          avpPct: slab.avpPct ?? 80,
          ssmPct: slab.ssmPct ?? 70,
          smPct: slab.smPct ?? 60,
          bdmPct: slab.bdmPct ?? 40,
          uplineBonus1Pct: slab.uplineBonus1Pct ?? 5,
          uplineBonus2Pct: slab.uplineBonus2Pct ?? 5,
          updatedBy: admin.userId,
        },
      })
    }

    const withSlab = await prisma.project.findUnique({
      where: { id: project.id },
      include: { slabConfigs: true },
    })

    return NextResponse.json({ project: withSlab ?? project })
  } catch (error: unknown) {
    console.error('Admin create project error:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
