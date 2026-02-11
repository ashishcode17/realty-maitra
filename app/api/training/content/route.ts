import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/error-handler'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all active training content
    const allContent = await prisma.trainingContent.findMany({
      where: { isActive: true },
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Filter by role visibility
    const visibleContent = allContent.filter((content) => {
      if (content.roleVisibility.length === 0) {
        return true // Visible to all
      }
      return content.roleVisibility.includes(user.role)
    })

    // Format response with download URLs
    const formatted = visibleContent.map((content) => ({
      id: content.id,
      title: content.title,
      category: content.category,
      type: content.type,
      description: content.description,
      projectId: content.projectId,
      project: content.project,
      fileName: content.fileName,
      fileSize: content.fileSize,
      fileType: content.fileType,
      videoEmbedUrl: content.videoEmbedUrl,
      downloadUrl: content.filePath
        ? `/api/files/download/${content.id}`
        : null,
      createdAt: content.createdAt,
    }))

    return NextResponse.json({ content: formatted })
  } catch (error: any) {
    return handleApiError(error, 'Get Training Content')
  }
}
