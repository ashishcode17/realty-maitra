'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ChevronLeft, Save, User, Search, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface UserDetail {
  id: string
  name: string
  email: string
  phone: string | null
  city: string | null
  role: string
  roleRank: number
  status: string
  sponsorId: string | null
  path: string[]
  sponsorCode: string | null
  createdAt: string
  sponsor: { id: string; name: string; email: string } | null
}

const ROLES = ['BDM', 'SM', 'SSM', 'AVP', 'VP', 'DIRECTOR', 'ADMIN', 'SUPER_ADMIN'] as const
const STATUSES = ['PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'FROZEN'] as const

export default function AdminUserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sponsorId, setSponsorId] = useState<string | null>(null)
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [sponsorSearch, setSponsorSearch] = useState('')
  const [sponsorOptions, setSponsorOptions] = useState<{ id: string; name: string; email: string }[]>([])
  const [sponsorSearchOpen, setSponsorSearchOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch(`/api/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load user')
        return res.json()
      })
      .then((data) => {
        setUser(data.user)
        setSponsorId(data.user.sponsorId ?? null)
        setRole(data.user.role)
        setStatus(data.user.status)
      })
      .catch(() => {
        toast.error('User not found')
        router.push('/admin/users')
      })
      .finally(() => setLoading(false))
  }, [id, router])

  useEffect(() => {
    if (!sponsorSearch.trim()) {
      setSponsorOptions([])
      return
    }
    const token = localStorage.getItem('token')
    const t = setTimeout(() => {
      fetch(`/api/admin/users?q=${encodeURIComponent(sponsorSearch)}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          const list = (data.users || []).filter((u: { id: string }) => u.id !== id)
          setSponsorOptions(list)
        })
    }, 300)
    return () => clearTimeout(t)
  }, [sponsorSearch, id])

  const handleDelete = async () => {
    if (!user) return
    setDeleting(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Delete failed')
      toast.success('User deleted. They can register again with the same email/phone.')
      router.push('/admin/users')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sponsorId: sponsorId ?? undefined, role, status }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Update failed')
      }
      const data = await res.json()
      setUser((prev) => (prev ? { ...prev, ...data.user } : null))
      setSponsorId(data.user.sponsorId ?? null)
      setRole(data.user.role)
      setStatus(data.user.status)
      toast.success('Saved')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-48 rounded bg-slate-800 animate-pulse" />
        <div className="h-64 rounded-lg bg-slate-800 animate-pulse" />
      </div>
    )
  }

  const selectedSponsor = sponsorId && (sponsorOptions.find((s) => s.id === sponsorId) ?? (user.sponsor && user.sponsor.id === sponsorId ? user.sponsor : null))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/users"
          className="rounded-lg border border-slate-600 p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Edit member</h1>
          <p className="text-slate-400">{user.name} · {user.email}</p>
        </div>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="h-5 w-5" /> Sponsor, role & status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sponsor reassignment */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Sponsor</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name or email to assign sponsor..."
                value={sponsorSearchOpen ? sponsorSearch : (selectedSponsor ? `${selectedSponsor.name} (${selectedSponsor.email})` : user.sponsor ? `${user.sponsor.name} (${user.sponsor.email})` : '')}
                onFocus={() => setSponsorSearchOpen(true)}
                onChange={(e) => {
                  setSponsorSearchOpen(true)
                  setSponsorSearch(e.target.value)
                }}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-600 bg-slate-900 text-white placeholder:text-slate-500 text-sm"
              />
              {sponsorSearchOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-slate-600 bg-slate-900 shadow-xl z-10 max-h-48 overflow-auto">
                  <button
                    type="button"
                    className="w-full px-4 py-2 text-left text-sm text-slate-400 hover:bg-slate-800"
                    onClick={() => {
                      setSponsorId(null)
                      setSponsorSearch('')
                      setSponsorSearchOpen(false)
                    }}
                  >
                    Clear sponsor
                  </button>
                  {sponsorOptions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="w-full px-4 py-2 text-left text-sm text-white hover:bg-slate-800"
                      onClick={() => {
                        setSponsorId(s.id)
                        setSponsorSearch('')
                        setSponsorSearchOpen(false)
                      }}
                    >
                      {s.name} · {s.email}
                    </button>
                  ))}
                  {sponsorSearch.trim() && sponsorOptions.length === 0 && (
                    <p className="px-4 py-2 text-slate-500 text-sm">No matches</p>
                  )}
                </div>
              )}
            </div>
            {!sponsorSearchOpen && (selectedSponsor || user.sponsor) && (
              <p className="mt-1 text-xs text-slate-500">Click field to change sponsor</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white text-sm"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving…' : 'Save changes'}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="border-red-500/60 text-red-400 hover:bg-red-950/50 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete user
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this user?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the user and their related data (Govt ID, OTP, etc.).
                    They will be able to register again with the same email and phone.
                    This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault()
                      handleDelete()
                    }}
                    disabled={deleting}
                    className="bg-red-600 hover:bg-red-500"
                  >
                    {deleting ? 'Deleting…' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
