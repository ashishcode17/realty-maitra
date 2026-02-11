import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/error-handler'
import fs from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'training')

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
]

async function saveUploadedFile(file: File): Promise<{
  filePath: string
  fileName: string
  fileType: string
  fileSize: number
}> {
  // Ensure upload directory exists
  await fs.mkdir(UPLOAD_DIR, { recursive: true })

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`)
  }

  // Validate file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed`)
  }

  // Generate unique filename
  const ext = path.extname(file.name)
  const uniqueId = randomUUID()
  const fileName = `${uniqueId}${ext}`
  const filePath = path.join(UPLOAD_DIR, fileName)

  // Convert File to Buffer and save
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  await fs.writeFile(filePath, buffer)

  return {
    filePath: `/uploads/training/${fileName}`, // Relative path for DB
    fileName: file.name, // Original filename
    fileType: file.type,
    fileSize: file.size,
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin access
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string
    const category = formData.get('category') as string
    const type = formData.get('type') as string
    const description = formData.get('description') as string | null
    const projectId = formData.get('projectId') as string | null
    const roleVisibility = formData.get('roleVisibility') as string | null

    // Validation
    if (!title || !category || !type) {
      return NextResponse.json(
        { error: 'Title, category, and type are required' },
        { status: 400 }
      )
    }

    // Handle VIDEO type
    if (type === 'VIDEO') {
      const videoUrl = formData.get('videoEmbedUrl') as string
      if (!videoUrl) {
        return NextResponse.json(
          { error: 'Video embed URL is required for VIDEO type' },
          { status: 400 }
        )
      }

      const content = await prisma.trainingContent.create({
        data: {
          title,
          category: category as any,
          type: 'VIDEO',
          videoEmbedUrl: videoUrl,
          description,
          projectId: projectId || undefined,
          roleVisibility: roleVisibility ? JSON.parse(roleVisibility) : [],
          createdById: admin.userId,
          uploadedBy: admin.userId,
          uploadedAt: new Date(),
        },
      })

      return NextResponse.json({
        message: 'Training content created',
        content: content,
      })
    }

    // For file-based types
    if (!file) {
      return NextResponse.json(
        { error: 'File is required for this content type' },
        { status: 400 }
      )
    }

    if (!['PDF', 'DOCUMENT', 'PPT', 'DOCX', 'XLS', 'IMAGE'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid content type for file upload' },
        { status: 400 }
      )
    }

    // Save file
    const uploadedFile = await saveUploadedFile(file)

    // Create training content record
    const content = await prisma.trainingContent.create({
      data: {
        title,
        category: category as any,
        type: type as any,
        filePath: uploadedFile.filePath,
        fileName: uploadedFile.fileName,
        fileType: uploadedFile.fileType,
        fileSize: uploadedFile.fileSize,
        description,
        projectId: projectId || undefined,
        roleVisibility: roleVisibility ? JSON.parse(roleVisibility) : [],
        createdById: admin.userId,
        uploadedBy: admin.userId,
        uploadedAt: new Date(),
      },
    })

    return NextResponse.json({
      message: 'File uploaded and training content created',
      content: content,
    })
  } catch (error: any) {
    return handleApiError(error, 'Upload Training Content')
  }
}
