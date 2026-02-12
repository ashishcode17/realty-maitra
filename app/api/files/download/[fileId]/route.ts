import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import path from 'path'
import fs from 'fs/promises'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ fileId: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const { fileId } = await context.params
    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }

    // Determine record kind + enforce access rules
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { role: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Try TrainingContent first (role visibility enforced)
    const trainingContent = await prisma.trainingContent.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        filePath: true,
        fileName: true,
        fileType: true,
        roleVisibility: true,
        isDemo: true,
      },
    })

    if (trainingContent?.filePath) {
      if (
        trainingContent.roleVisibility.length > 0 &&
        !trainingContent.roleVisibility.includes(user.role)
      ) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      await prisma.fileDownloadLog
        .create({
          data: {
            userId: auth.userId,
            fileId,
            fileKind: 'TRAINING_CONTENT',
            isDemo: trainingContent.isDemo,
          },
        })
        .catch(() => {})

      return await sendFileAsAttachment({
        filePath: trainingContent.filePath,
        downloadName: trainingContent.fileName || 'training-file',
        mimeType: trainingContent.fileType || 'application/octet-stream',
      })
    }

    // Then ProjectDocument (MVP: any authenticated user can download)
    const projectDoc = await prisma.projectDocument.findUnique({
      where: { id: fileId },
      select: { filePath: true, fileName: true, fileType: true, isDemo: true },
    })
    if (projectDoc?.filePath) {
      await prisma.fileDownloadLog
        .create({
          data: {
            userId: auth.userId,
            fileId,
            fileKind: 'PROJECT_DOCUMENT',
            isDemo: projectDoc.isDemo,
          },
        })
        .catch(() => {})

      return await sendFileAsAttachment({
        filePath: projectDoc.filePath,
        downloadName: projectDoc.fileName || 'project-document',
        mimeType: projectDoc.fileType || 'application/octet-stream',
      })
    }

    // OfferChallenge banner download support (stored on challenge)
    const offer = await prisma.offerChallenge.findUnique({
      where: { id: fileId },
      select: {
        bannerFilePath: true,
        bannerFileName: true,
        bannerFileType: true,
        isDemo: true,
      },
    })
    if (offer?.bannerFilePath) {
      await prisma.fileDownloadLog
        .create({
          data: {
            userId: auth.userId,
            fileId,
            fileKind: 'OFFER_BANNER',
            isDemo: offer.isDemo,
          },
        })
        .catch(() => {})

      return await sendFileAsAttachment({
        filePath: offer.bannerFilePath,
        downloadName: offer.bannerFileName || 'offer-banner',
        mimeType: offer.bannerFileType || 'application/octet-stream',
      })
    }

    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  } catch (error: any) {
    console.error('File download error:', error)
    return NextResponse.json(
      { error: 'Failed to download file', message: error.message },
      { status: 500 }
    )
  }
}

async function sendFileAsAttachment(args: {
  filePath: string
  downloadName: string
  mimeType: string
}) {
  const fullPath = path.join(process.cwd(), args.filePath)

  const uploadsPath = path.join(process.cwd(), 'uploads')
  if (!fullPath.startsWith(uploadsPath)) {
    return NextResponse.json({ error: 'Invalid file path' }, { status: 403 })
  }

  try {
    const fileBuffer = await fs.readFile(fullPath)
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': args.mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(
          args.downloadName
        )}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (fileError: any) {
    if (fileError.code === 'ENOENT') {
      return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })
    }
    throw fileError
  }
}

