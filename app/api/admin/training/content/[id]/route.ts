import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/error-handler'

/** GET: Admin get single training content */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    const { id } = await context.params
    const content = await prisma.trainingContent.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
      },
    })

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    return NextResponse.json({ content })
  } catch (error: unknown) {
    return handleApiError(error, 'Get Training Content')
  }
}

/** PATCH: Admin update training content (metadata only; file replace via upload) */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    const { id } = await context.params
    const existing = await prisma.trainingContent.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      title,
      category,
      type,
      description,
      videoEmbedUrl,
      isActive,
      projectId,
      roleVisibility,
    } = body as {
      title?: string
      category?: string
      type?: string
      description?: string
      videoEmbedUrl?: string
      isActive?: boolean
      projectId?: string | null
      roleVisibility?: string[]
    }

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (category !== undefined) updateData.category = category
    if (type !== undefined) updateData.type = type
    if (description !== undefined) updateData.description = description
    if (videoEmbedUrl !== undefined) updateData.videoEmbedUrl = videoEmbedUrl
    if (isActive !== undefined) updateData.isActive = isActive
    if (projectId !== undefined) updateData.projectId = projectId ?? null
    if (roleVisibility !== undefined) updateData.roleVisibility = roleVisibility ?? []

    const content = await prisma.trainingContent.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ content })
  } catch (error: unknown) {
    return handleApiError(error, 'Update Training Content')
  }
}
