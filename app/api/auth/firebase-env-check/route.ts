import { NextResponse } from 'next/server'

/**
 * Check if Firebase env vars are present (for debugging "Firebase is not configured").
 * Open: https://your-site.com/api/auth/firebase-env-check
 * Does not reveal actual values.
 */
export async function GET() {
  const hasApiKey = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  const hasAuthDomain = !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  const hasProjectId = !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const hasStorageBucket = !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  const hasMessagingSenderId = !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  const hasAppId = !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID

  const allPresent = hasApiKey && hasAuthDomain && hasProjectId && hasStorageBucket && hasMessagingSenderId && hasAppId

  return NextResponse.json({
    configured: allPresent,
    vars: {
      NEXT_PUBLIC_FIREBASE_API_KEY: hasApiKey,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: hasAuthDomain,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: hasProjectId,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: hasStorageBucket,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: hasMessagingSenderId,
      NEXT_PUBLIC_FIREBASE_APP_ID: hasAppId,
    },
  })
}
