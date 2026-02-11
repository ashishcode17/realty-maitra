import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/error-handler'
import fs from 'fs/promises'
import path from 'path'

// GET - List all training content (admin view)
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    const contents = await prisma.trainingContent.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json({ contents })
  } catch (error: any) {
    return handleApiError(error, 'Get Training Content')
  }
}

// DELETE - Delete training content
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Content ID is required' },
        { status: 400 }
      )
    }

    // Get content to delete file if exists
    const content = await prisma.trainingContent.findUnique({
      where: { id },
      select: { filePath: true },
    })

    // Delete file from disk if exists
    if (content?.filePath) {
      try {
        const fullPath = path.join(process.cwd(), content.filePath)
        const uploadsPath = path.join(process.cwd(), 'uploads')
        
        // Security check
        if (fullPath.startsWith(uploadsPath)) {
          await fs.unlink(fullPath).catch(() => {
            // File might not exist, that's okay
          })
        }
      } catch (error) {
        console.error('Failed to delete file:', error)
        // Continue with DB deletion even if file deletion fails
      }
    }

    // Delete from database
    await prisma.trainingContent.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Training content deleted' })
  } catch (error: any) {
    return handleApiError(error, 'Delete Training Content')
  }
}
