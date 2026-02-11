import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import path from 'path'
import fs from 'fs/promises'
import { randomUUID } from 'crypto'

const AVATAR_DIR = path.join(process.cwd(), 'uploads', 'avatars')
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/**
 * POST /api/settings/avatar
 * Upload profile photo (multipart/form-data, field: file).
 * jpg/png/webp only, max 5MB.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const formData = await request.formData()
    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Use JPG, PNG, or WebP only.' },
        { status: 400 }
      )
    }

    const ext = file.type === 'image/png' ? '.png' : file.type === 'image/webp' ? '.webp' : '.jpg'
    const dir = path.join(AVATAR_DIR, auth.userId)
    await fs.mkdir(dir, { recursive: true })
    const fileName = `${randomUUID()}${ext}`
    const filePath = path.join(dir, fileName)
    const relativePath = path.join('uploads', 'avatars', auth.userId, fileName).replace(/\\/g, '/')

    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(filePath, buffer)

    await prisma.user.update({
      where: { id: auth.userId },
      data: { profilePhotoUrl: relativePath },
    })

    return NextResponse.json({
      success: true,
      profilePhotoUrl: relativePath,
    })
  } catch (e: any) {
    console.error('Avatar upload error:', e)
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/settings/avatar
 * Remove profile photo.
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { profilePhotoUrl: true },
    })
    if (user?.profilePhotoUrl) {
      const fullPath = path.join(process.cwd(), user.profilePhotoUrl)
      const uploadsPath = path.join(process.cwd(), 'uploads')
      if (fullPath.startsWith(uploadsPath)) {
        await fs.unlink(fullPath).catch(() => {})
      }
    }
    await prisma.user.update({
      where: { id: auth.userId },
      data: { profilePhotoUrl: null },
    })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('Avatar delete error:', e)
    return NextResponse.json(
      { error: 'Failed to remove avatar' },
      { status: 500 }
    )
  }
}
