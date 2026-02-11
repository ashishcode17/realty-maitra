// JavaScript version for Node.js compatibility
const fs = require('fs').promises
const path = require('path')
const { v4: uuidv4 } = require('uuid')

const UPLOAD_BASE_DIR = path.join(process.cwd(), 'uploads')
const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB

/**
 * Initialize upload directories
 */
async function initializeUploadDirs() {
  const dirs = [
    path.join(UPLOAD_BASE_DIR, 'training'),
    path.join(UPLOAD_BASE_DIR, 'projects'),
    path.join(UPLOAD_BASE_DIR, 'offers'),
  ]

  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true })
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error
      }
    }
  }
}

/**
 * Get file from disk (for download)
 */
async function getFile(relativePath) {
  // Security: Ensure path is within uploads directory
  const fullPath = path.join(process.cwd(), relativePath)
  const uploadsPath = path.join(process.cwd(), 'uploads')

  if (!fullPath.startsWith(uploadsPath)) {
    throw new Error('Invalid file path')
  }

  try {
    const buffer = await fs.readFile(fullPath)
    return buffer
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('File not found')
    }
    throw error
  }
}

/**
 * Delete file from disk
 */
async function deleteFile(relativePath) {
  const fullPath = path.join(process.cwd(), relativePath)
  const uploadsPath = path.join(process.cwd(), 'uploads')

  if (!fullPath.startsWith(uploadsPath)) {
    throw new Error('Invalid file path')
  }

  try {
    await fs.unlink(fullPath)
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error
    }
  }
}

module.exports = {
  initializeUploadDirs,
  getFile,
  deleteFile,
  UPLOAD_BASE_DIR,
  MAX_FILE_SIZE,
}
