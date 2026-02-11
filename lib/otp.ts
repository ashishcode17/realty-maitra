// Simple in-memory OTP store
// In production, use Redis or database
const otpStore = new Map<string, { otp: string; expiresAt: number; type: 'email' | 'phone' }>()

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function storeOTP(identifier: string, otp: string, type: 'email' | 'phone' = 'email') {
  const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes
  otpStore.set(identifier, { otp, expiresAt, type })
}

export function verifyOTP(identifier: string, otp: string): boolean {
  const stored = otpStore.get(identifier)
  
  if (!stored) return false
  if (stored.expiresAt < Date.now()) {
    otpStore.delete(identifier)
    return false
  }
  if (stored.otp !== otp) return false

  otpStore.delete(identifier)
  return true
}

export function clearOTP(identifier: string) {
  otpStore.delete(identifier)
}

// Cleanup expired OTPs periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of otpStore.entries()) {
    if (value.expiresAt < now) {
      otpStore.delete(key)
    }
  }
}, 5 * 60 * 1000) // Every 5 minutes
