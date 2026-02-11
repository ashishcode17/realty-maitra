'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, ChevronLeft, UserPlus, Search } from 'lucide-react'
import Link from 'next/link'

interface UserRow {
  id: string
  name: string
  email: string
  role: string
  city: string | null
  status: string
  createdAt: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    params.set('limit', '200')
    fetch(`/api/admin/users?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.users) setUsers(data.users)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [q])

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
          <h1 className="text-3xl font-bold text-white">Manage Members</h1>
          <p className="text-slate-400">View and reassign sponsors, roles, status</p>
        </div>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5" /> All members
          </CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="search"
              placeholder="Search by name or email..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-600 bg-slate-900 text-white placeholder:text-slate-500 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 rounded bg-slate-700/50 animate-pulse" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <p className="text-slate-400 py-8 text-center">No members found.</p>
          ) : (
            <>
              <div className="md:hidden space-y-3">
                {users.map((u) => (
                  <div key={u.id} className="p-4 rounded-lg border border-slate-600 bg-slate-800/50 hover:bg-slate-700/30">
                    <p className="font-medium text-white">{u.name}</p>
                    <p className="text-sm text-slate-400 truncate">{u.email}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 text-xs">{u.role}</span>
                      <span className="text-slate-400 text-xs">{u.status}</span>
                      {u.city && <span className="text-slate-500 text-xs">{u.city}</span>}
                    </div>
                    <Link href={`/admin/users/${u.id}`} className="tap-target mt-3 inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-sm font-medium min-h-[44px] items-center">
                      <UserPlus className="h-4 w-4" /> Edit
                    </Link>
                  </div>
                ))}
              </div>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-left text-slate-400">
                      <th className="pb-3 pr-4">Name</th>
                      <th className="pb-3 pr-4">Email</th>
                      <th className="pb-3 pr-4">Role</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 pr-4">City</th>
                      <th className="pb-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-700/30">
                        <td className="py-3 pr-4 font-medium text-white">{u.name}</td>
                        <td className="py-3 pr-4 text-slate-300">{u.email}</td>
                        <td className="py-3 pr-4">
                          <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 text-xs">{u.role}</span>
                        </td>
                        <td className="py-3 pr-4 text-slate-400">{u.status}</td>
                        <td className="py-3 pr-4 text-slate-400">{u.city ?? '-'}</td>
                        <td className="py-3">
                          <Link href={`/admin/users/${u.id}`} className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-sm">
                            <UserPlus className="h-4 w-4" /> Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
