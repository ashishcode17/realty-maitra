'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Users, ChevronLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { AvatarWithAuth } from '@/components/AvatarWithAuth'

interface OnlineUser {
  id: string
  name: string
  email: string
  role: string
  rank: string
  performanceRank?: string
  profilePhotoUrl: string | null
  lastSeenAt: string | null
  isOnline: boolean
  treeId: string | null
}

export default function AdminOnlinePage() {
  const [users, setUsers] = useState<OnlineUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [polling, setPolling] = useState(true)

  const load = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/online-users', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!polling) return
    const t = setInterval(load, 15_000)
    return () => clearInterval(t)
  }, [polling])

  const filtered = search.trim()
    ? users.filter(
        (u) =>
          u.name?.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase())
      )
    : users
  const onlineCount = filtered.filter((u) => u.isOnline).length

  const formatLastSeen = (lastSeenAt: string | null) => {
    if (!lastSeenAt) return 'Never'
    const ms = Date.now() - new Date(lastSeenAt).getTime()
    const mins = Math.floor(ms / 60_000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins} min ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin"
          className="rounded-lg border border-slate-600 p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Online users</h1>
          <p className="text-slate-400">Who is active now (green dot). Updates every 15s.</p>
        </div>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5" />
            Active now: {onlineCount}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-slate-400 text-xs">Search by name or email</Label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="mt-1 bg-slate-900 border-slate-600 text-white max-w-xs"
            />
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center gap-4 py-3 px-4 rounded-lg bg-slate-900/50 border border-slate-700"
                >
                  <div className="relative">
                    <AvatarWithAuth userId={u.id} name={u.name} size="md" />
                    {u.isOnline && (
                      <span
                        className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-800"
                        title="Online"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{u.name}</p>
                    <p className="text-slate-400 text-sm truncate">{u.email}</p>
                  </div>
                  <div className="text-slate-400 text-sm">
                    {u.isOnline ? (
                      <span className="text-emerald-400">Active now</span>
                    ) : (
                      <span>Last seen: {formatLastSeen(u.lastSeenAt)}</span>
                    )}
                  </div>
                  <div className="text-slate-500 text-xs">
                    {u.rank ?? u.role ?? '—'} · {u.treeId ? String(u.treeId).slice(0, 8) + '…' : '—'}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {!loading && filtered.length === 0 && (
            <p className="text-slate-400 py-8 text-center">No users match.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
