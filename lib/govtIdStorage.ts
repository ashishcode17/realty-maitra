/**
 * Govt ID file storage for live/serverless (e.g. Vercel) where filesystem is read-only.
 * Uses Firebase Storage when FIREBASE_SERVICE_ACCOUNT_JSON and FIREBASE_STORAGE_BUCKET are set.
 */

import admin from 'firebase-admin'
import { getStorage } from 'firebase-admin/storage'

const GOVT_ID_PREFIX = 'govt-ids/'

let storageApp: admin.app.App | null = null

function getStorageApp(): admin.app.App | null {
  if (storageApp) return storageApp
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  const bucketName =
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  if (!json || typeof json !== 'string' || !bucketName?.trim()) return null
  try {
    const cred = JSON.parse(json)
    storageApp =
      admin.apps.length > 0
        ? (admin.app() as admin.app.App)
        : admin.initializeApp({
            credential: admin.credential.cert(cred),
            storageBucket: bucketName.trim(),
          })
    return storageApp
  } catch {
    return null
  }
}

function getBucket(): ReturnType<ReturnType<typeof getStorage>['bucket']> | null {
  const app = getStorageApp()
  if (!app) return null
  try {
    const bucketName =
      process.env.FIREBASE_STORAGE_BUCKET ||
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    return getStorage(app).bucket(bucketName || undefined)
  } catch {
    return null
  }
}

export function isGovtIdFirebaseConfigured(): boolean {
  return getBucket() != null
}

/**
 * Store Govt ID file in Firebase. Returns path to store in DB (e.g. "govt-ids/xxx.jpg").
 */
export async function uploadGovtIdToFirebase(
  buffer: Buffer,
  fileName: string,
  contentType: 'image/jpeg' | 'image/png'
): Promise<string> {
  const bucket = getBucket()
  if (!bucket) throw new Error('Firebase Storage not configured for Govt ID')
  const path = GOVT_ID_PREFIX + fileName
  const file = bucket.file(path)
  await file.save(buffer, {
    metadata: { contentType },
  })
  return path
}

/**
 * Download Govt ID from Firebase. Path should be what we stored (e.g. "govt-ids/xxx.jpg").
 */
export async function downloadGovtIdFromFirebase(path: string): Promise<Buffer> {
  const bucket = getBucket()
  if (!bucket) throw new Error('Firebase Storage not configured')
  const [contents] = await bucket.file(path).download()
  return Buffer.from(contents)
}

export function isFirebaseGovtIdPath(storedPath: string): boolean {
  return storedPath.startsWith(GOVT_ID_PREFIX) && !storedPath.includes('..')
}
