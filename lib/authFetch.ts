/**
 * Fetch with Authorization header from localStorage (for authenticated API calls).
 * Use this in client components so all tabs get real data when logged in.
 */
export function authHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('token')
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

export function authFetch(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, { ...init, headers: { ...authHeaders(), ...init?.headers } })
}
