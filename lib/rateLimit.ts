/**
 * In-memory rate limiter for auth endpoints (login/register/OTP).
 * Production: prefer Redis or Upstash; this is safe for single-instance and demo.
 */

const windowMs = 60 * 1000 // 1 minute
const maxPerWindow = 10 // per IP for login/register

const otpWindowMs = 15 * 60 * 1000 // 15 minutes for OTP
const otpSendMaxPerWindow = 5 // send OTP per IP per 15 min
const otpVerifyMaxPerWindow = 15 // verify attempts per IP per 15 min

const store = new Map<string, { count: number; resetAt: number }>()

export function getClientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') ?? 'unknown'
  return ip
}

export function checkRateLimit(request: Request): { ok: true } | { ok: false; retryAfter: number } {
  const key = getClientKey(request)
  const now = Date.now()
  let entry = store.get(key)
  if (!entry) {
    entry = { count: 1, resetAt: now + windowMs }
    store.set(key, entry)
    return { ok: true }
  }
  if (now >= entry.resetAt) {
    entry = { count: 1, resetAt: now + windowMs }
    store.set(key, entry)
    return { ok: true }
  }
  entry.count += 1
  if (entry.count > maxPerWindow) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }
  return { ok: true }
}

/** Stricter limit for sending OTP (prevents abuse) */
export function checkOtpSendRateLimit(request: Request): { ok: true } | { ok: false; retryAfter: number } {
  const key = `otp_send:${getClientKey(request)}`
  const now = Date.now()
  let entry = store.get(key)
  if (!entry) {
    entry = { count: 1, resetAt: now + otpWindowMs }
    store.set(key, entry)
    return { ok: true }
  }
  if (now >= entry.resetAt) {
    entry = { count: 1, resetAt: now + otpWindowMs }
    store.set(key, entry)
    return { ok: true }
  }
  entry.count += 1
  if (entry.count > otpSendMaxPerWindow) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }
  return { ok: true }
}

/** Limit for verify OTP attempts */
export function checkOtpVerifyRateLimit(request: Request): { ok: true } | { ok: false; retryAfter: number } {
  const key = `otp_verify:${getClientKey(request)}`
  const now = Date.now()
  let entry = store.get(key)
  if (!entry) {
    entry = { count: 1, resetAt: now + otpWindowMs }
    store.set(key, entry)
    return { ok: true }
  }
  if (now >= entry.resetAt) {
    entry = { count: 1, resetAt: now + otpWindowMs }
    store.set(key, entry)
    return { ok: true }
  }
  entry.count += 1
  if (entry.count > otpVerifyMaxPerWindow) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }
  return { ok: true }
}
