'use client'

import { useEffect, useRef } from 'react'

const INTERVAL_MS = 30_000

/**
 * Calls POST /api/heartbeat every 30s while tab is visible. Pauses when tab is hidden.
 */
export function HeartbeatProvider() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const tick = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      const token = localStorage.getItem('token')
      if (!token) return
      fetch('/api/heartbeat', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }

    const start = () => {
      tick()
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = setInterval(tick, INTERVAL_MS)
    }
    const stop = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') start()
      else stop()
    }
    if (document.visibilityState === 'visible') start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      stop()
    }
  }, [])

  return null
}
