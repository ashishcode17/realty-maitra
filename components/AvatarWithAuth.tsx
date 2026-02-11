'use client'

import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

/**
 * Avatar that loads profile photo from secure API (sends Bearer token).
 * Use when the image is behind auth (e.g. /api/files/avatar/[userId]).
 */
export function AvatarWithAuth({
  userId,
  name,
  className,
  size = 'md',
}: {
  userId: string | null | undefined
  name?: string | null
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  const sizeClass =
    size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : size === 'xl' ? 'h-20 w-20' : 'h-10 w-10'
  const initial = name ? name.slice(0, 2).toUpperCase() : 'U'

  useEffect(() => {
    if (!userId) {
      setObjectUrl(null)
      return
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      setObjectUrl(null)
      return
    }
    let revoked = false
    fetch(`/api/files/avatar/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok || revoked) return null
        return res.blob()
      })
      .then((blob) => {
        if (revoked || !blob) return
        setObjectUrl(URL.createObjectURL(blob))
      })
      .catch(() => setObjectUrl(null))
    return () => {
      revoked = true
      setObjectUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    }
  }, [userId])

  useEffect(() => {
    const handler = () => {
      setObjectUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      if (userId) {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        if (token) {
          fetch(`/api/files/avatar/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((res) => (res.ok ? res.blob() : null))
            .then((blob) => {
              if (blob) setObjectUrl(URL.createObjectURL(blob))
            })
        }
      }
    }
    window.addEventListener('avatar-updated', handler)
    return () => window.removeEventListener('avatar-updated', handler)
  }, [userId])

  return (
    <Avatar className={`${sizeClass} border-2 border-slate-700 bg-slate-800 ${className ?? ''}`}>
      {objectUrl ? <AvatarImage src={objectUrl} alt={name ?? 'Avatar'} /> : null}
      <AvatarFallback className="bg-emerald-600 text-sm font-semibold text-white">
        {initial}
      </AvatarFallback>
    </Avatar>
  )
}
