/**
 * In-memory rate limiter for auth endpoints (login/register).
 * Production: prefer Redis or Upstash; this is safe for single-instance and demo.
 */

const windowMs = 60 * 1000 // 1 minute
const maxPerWindow = 10 // per IP

const store = new Map<string, { count: number; resetAt: number }>()

function getClientKey(request: Request): string {
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
