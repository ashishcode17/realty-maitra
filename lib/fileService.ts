import fs from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

const UPLOAD_BASE_DIR = path.join(process.cwd(), 'uploads')
const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB

const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
}

export type UploadCategory = 'training' | 'projects' | 'offers'

export interface UploadedFile {
  filePath: string
  fileName: string
  fileType: string
  fileSize: number
}

/**
 * Initialize upload directories
 */
export async function initializeUploadDirs() {
  const dirs = [
    path.join(UPLOAD_BASE_DIR, 'training'),
    path.join(UPLOAD_BASE_DIR, 'projects'),
    path.join(UPLOAD_BASE_DIR, 'offers'),
  ]

  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true })
    } catch (error: any) {
      if (error.code !== 'EEXIST') {
        throw error
      }
    }
  }
}

/**
 * Validate file type and size
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    }
  }

  // Check file type
  const allowedTypes = Object.keys(ALLOWED_FILE_TYPES)
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: PDF, PPT, PPTX, DOC, DOCX, XLS, XLSX, JPG, PNG`,
    }
  }

  return { valid: true }
}

/**
 * Save uploaded file to disk (for FormData)
 */
export async function saveFileFromFormData(
  fileData: {
    name: string
    type: string
    size: number
    buffer: Buffer
  },
  category: UploadCategory
): Promise<UploadedFile> {
  await initializeUploadDirs()

  // Validate file size
  if (fileData.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`)
  }

  // Validate file type
  const allowedTypes = Object.keys(ALLOWED_FILE_TYPES)
  if (!allowedTypes.includes(fileData.type)) {
    throw new Error(`File type ${fileData.type} is not allowed`)
  }

  // Generate unique filename
  const ext = path.extname(fileData.name)
  const uniqueId = randomUUID()
  const fileName = `${uniqueId}${ext}`
  const filePath = path.join(UPLOAD_BASE_DIR, category, fileName)

  // Save file
  await fs.writeFile(filePath, fileData.buffer)

  return {
    filePath: `/uploads/${category}/${fileName}`, // Relative path for DB
    fileName: fileData.name, // Original filename
    fileType: fileData.type,
    fileSize: fileData.size,
  }
}

/**
 * Get file from disk (for download)
 */
export async function getFile(relativePath: string): Promise<Buffer> {
  // Security: Ensure path is within uploads directory
  const fullPath = path.join(process.cwd(), relativePath)
  const uploadsPath = path.join(process.cwd(), 'uploads')

  if (!fullPath.startsWith(uploadsPath)) {
    throw new Error('Invalid file path')
  }

  try {
    const buffer = await fs.readFile(fullPath)
    return buffer
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error('File not found')
    }
    throw error
  }
}

/**
 * Delete file from disk
 */
export async function deleteFile(relativePath: string): Promise<void> {
  const fullPath = path.join(process.cwd(), relativePath)
  const uploadsPath = path.join(process.cwd(), 'uploads')

  if (!fullPath.startsWith(uploadsPath)) {
    throw new Error('Invalid file path')
  }

  try {
    await fs.unlink(fullPath)
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      throw error
    }
  }
}

/**
 * Get MIME type from file extension
 */
export function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase()
  const mimeMap: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
  }
  return mimeMap[ext] || 'application/octet-stream'
}
