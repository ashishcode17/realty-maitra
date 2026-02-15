/**
 * Firebase Admin – verify phone auth ID tokens on the server.
 * Set FIREBASE_SERVICE_ACCOUNT_JSON (stringified JSON from Firebase Console → Project Settings → Service accounts).
 */

import admin from 'firebase-admin'

let app: admin.app.App | null = null

function getAdminApp(): admin.app.App | null {
  if (app) return app
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!json || typeof json !== 'string') return null
  try {
    const cred = JSON.parse(json)
    app = admin.apps.length
      ? (admin.app() as admin.app.App)
      : admin.initializeApp({ credential: admin.credential.cert(cred) })
    return app
  } catch {
    return null
  }
}

export interface FirebasePhoneDecoded {
  uid: string
  phone_number: string
}

/**
 * Verify a Firebase ID token from phone sign-in. Returns decoded claims including phone_number (E.164).
 */
export async function verifyFirebaseIdToken(
  idToken: string
): Promise<FirebasePhoneDecoded | null> {
  const a = getAdminApp()
  if (!a) return null
  try {
    const decoded = await admin.auth().verifyIdToken(idToken)
    if (decoded.firebase?.sign_in_provider !== 'phone') return null
    const phone = decoded.phone_number
    if (!phone || typeof phone !== 'string') return null
    return { uid: decoded.uid, phone_number: phone }
  } catch {
    return null
  }
}
