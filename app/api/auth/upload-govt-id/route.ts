import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import path from 'node:path'
import fs from 'fs/promises'
import { randomUUID } from 'crypto'

const GOVT_ID_DIR = path.join(process.cwd(), 'uploads', 'govt-ids')
const MAX_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png']
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png']

/**
 * POST /api/auth/upload-govt-id
 * Public (no auth). Called after register to attach Govt ID to pending user.
 * FormData: email, file. Finds User with email = pending_${email}.
 * JPG/PNG only, max 2MB. Server-side validation.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const email = formData.get('email')
    const file = formData.get('file')
    const emailStr = typeof email === 'string' ? email.trim().toLowerCase() : ''
    if (!emailStr) {
      return NextResponse.json(
        { error: 'Email is required', code: 'MISSING_EMAIL' },
        { status: 400 }
      )
    }
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Govt ID image is required', code: 'MISSING_FILE' },
        { status: 400 }
      )
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 2MB.', code: 'FILE_TOO_LARGE' },
        { status: 400 }
      )
    }
    const mime = file.type?.toLowerCase()
    if (!mime || !ALLOWED_TYPES.includes(mime)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG and PNG are allowed.', code: 'INVALID_FILE_TYPE' },
        { status: 400 }
      )
    }
    const ext = mime === 'image/png' ? '.png' : '.jpg'
    const pendingUser = await prisma.user.findUnique({
      where: { email: `pending_${emailStr}` },
      select: { id: true },
    })
    if (!pendingUser) {
      return NextResponse.json(
        { error: 'Registration session not found. Please complete the registration form first.', code: 'PENDING_NOT_FOUND' },
        { status: 400 }
      )
    }
    await fs.mkdir(GOVT_ID_DIR, { recursive: true })
    const fileName = `${pendingUser.id}_${randomUUID()}${ext}`
    const filePath = path.join(GOVT_ID_DIR, fileName)
    const relativePath = path.join('uploads', 'govt-ids', fileName).replace(/\\/g, '/')
    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(filePath, buffer)
    await prisma.user.update({
      where: { id: pendingUser.id },
      data: { idImageUrl: relativePath, idImageUploadedAt: new Date() },
    })
    return NextResponse.json({ success: true, idImageUrl: relativePath })
  } catch (e: unknown) {
    console.error('Govt ID upload error:', e)
    return NextResponse.json(
      { error: 'Failed to upload Govt ID', code: 'UPLOAD_ERROR' },
      { status: 500 }
    )
  }
}
