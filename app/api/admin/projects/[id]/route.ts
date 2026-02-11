import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware'

/** GET: Admin get single project with slab */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    const { id } = await params
    const project = await prisma.project.findUnique({
      where: { id },
      include: { slabConfigs: true, projectDocuments: true },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({ project })
  } catch (error: unknown) {
    console.error('Admin get project error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

/** PATCH: Admin update project and optional slab */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    const { id } = await params
    const body = await request.json()
    const {
      name,
      location,
      type,
      status,
      description,
      media,
      documents,
      slab,
    } = body as {
      name?: string
      location?: string
      type?: string
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

    const existing = await prisma.project.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (location !== undefined) updateData.location = location
    if (type !== undefined) updateData.type = type
    if (status !== undefined) updateData.status = status
    if (description !== undefined) updateData.description = description
    if (Array.isArray(media)) updateData.media = media
    if (Array.isArray(documents)) updateData.documents = documents

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
    })

    if (slab && typeof slab === 'object') {
      await prisma.slabConfig.upsert({
        where: { projectId: id },
        create: {
          projectId: id,
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
      where: { id },
      include: { slabConfigs: true },
    })

    return NextResponse.json({ project: withSlab ?? project })
  } catch (error: unknown) {
    console.error('Admin update project error:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

/** DELETE: Admin delete project (cascade: slab, docs, etc.) */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    const { id } = await params
    const existing = await prisma.project.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    await prisma.project.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Admin delete project error:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
