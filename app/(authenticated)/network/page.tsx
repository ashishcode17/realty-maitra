'use client'

import { useEffect, useState } from 'react'
import { Users, UserPlus, QrCode, Search, Network } from 'lucide-react'
import QRCode from 'qrcode'
import { NetworkTreeView } from '@/components/NetworkTreeView'

interface NetworkUser {
  id: string
  name: string
  email: string
  role: string
  city?: string | null
  status: string
  createdAt: string
}

interface MeUser {
  id: string
  name?: string | null
  email?: string | null
  isDemo?: boolean | null
  role?: string
}

export default function NetworkPage() {
  const [directDownlines, setDirectDownlines] = useState<NetworkUser[]>([])
  const [allDownlines, setAllDownlines] = useState<NetworkUser[]>([])
  const [user, setUser] = useState<MeUser | null>(null)
  const [sponsorLink, setSponsorLink] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'mindmap'>('mindmap')
  const [searchTerm, setSearchTerm] = useState('')
  const [adminUsers, setAdminUsers] = useState<NetworkUser[]>([])
  const [selectedRootId, setSelectedRootId] = useState<string | null>(null)
  const [selectedRootName, setSelectedRootName] = useState<string>('Me')
  const [platformRootId, setPlatformRootId] = useState<string | null>(null)
  const [platformRootName, setPlatformRootName] = useState<string>('Entire network')

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const isEntireNetwork = selectedRootId === '__platform__'
  const effectiveRootId = isEntireNetwork
    ? platformRootId
    : (isAdmin && selectedRootId) ? selectedRootId : user?.id ?? null
  const effectiveRootName = isEntireNetwork ? platformRootName : (selectedRootId ? selectedRootName : 'Me')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    fetch('/api/auth/me', { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user)
          setView('mindmap')
          const link = `${window.location.origin}/register?sponsor=${data.user.id}`
          setSponsorLink(link)
          QRCode.toDataURL(link).then((url) => setQrCodeUrl(url))
        }
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    const token = localStorage.getItem('token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    Promise.all([
      fetch('/api/admin/users?limit=500', { headers }).then((r) => r.json()),
      fetch('/api/admin/network/root', { headers }).then((r) => r.json()),
    ]).then(([userData, rootData]) => {
      if (userData.users) setAdminUsers(userData.users)
      if (rootData.rootId) {
        setPlatformRootId(rootData.rootId)
        if (rootData.rootName) setPlatformRootName(rootData.rootName)
      }
    })
  }, [isAdmin])

  useEffect(() => {
    if (!user?.id && !effectiveRootId) return
    const token = localStorage.getItem('token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const rootParam = isAdmin && effectiveRootId ? `&rootId=${encodeURIComponent(effectiveRootId)}` : ''
    setLoading(true)
    Promise.all([
      fetch(`/api/network/direct?${rootParam.replace(/^&/, '')}`, { headers }).then((r) => r.json()),
      fetch(`/api/network/all?${rootParam.replace(/^&/, '')}`, { headers }).then((r) => r.json()),
    ])
      .then(([directData, allData]) => {
        if (directData.users) setDirectDownlines(directData.users)
        if (allData.users) setAllDownlines(allData.users)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user?.id, effectiveRootId, isAdmin])

  const filteredDownlines = allDownlines.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.city?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading && !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-9 w-48 rounded bg-slate-800" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-lg bg-slate-800 border border-slate-700" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 rounded-xl bg-slate-900/95 shadow-lg border border-slate-700">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">My Network</h1>
        <p className="mt-2 text-slate-400">Manage your team and track growth</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow p-6 text-white">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-400">Total Network</p>
              <p className="text-2xl font-bold text-white">{allDownlines.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow p-6 text-white">
          <div className="flex items-center">
            <UserPlus className="w-8 h-8 text-green-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-400">Direct Downlines</p>
              <p className="text-2xl font-bold text-white">{directDownlines.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow p-6 text-white">
          <div className="flex items-center">
            <QrCode className="w-8 h-8 text-purple-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-400">Your Sponsor Code</p>
              <p className="text-lg font-bold text-white">{user?.id.substring(0, 8)}...</p>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Section */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow p-6 mb-8 text-white">
        <h2 className="text-xl font-semibold text-white mb-4">Invite New Members</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Your Sponsor Link
            </label>
            <div className="flex">
              <input
                type="text"
                value={sponsorLink}
                readOnly
                className="flex-1 px-3 py-2 border border-slate-600 rounded-l-md bg-slate-700 text-white text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(sponsorLink)
                  alert('Link copied!')
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 tap-target"
                aria-label="Copy sponsor link"
              >
                Copy
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Share this link or your sponsor code: <strong className="text-slate-200">{user?.id}</strong>
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              QR Code
            </label>
            {qrCodeUrl && (
              <div className="flex items-center justify-center p-4 border border-slate-600 rounded-lg bg-slate-700/50">
                <img src={qrCodeUrl} alt="QR Code for sponsor link" width={128} height={128} className="w-32 h-32" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin: View tree for user */}
      {isAdmin && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-400">View tree for:</span>
          <select
            value={selectedRootId ?? ''}
            onChange={(e) => {
              const id = e.target.value || null
              setSelectedRootId(id)
              if (!id) {
                setSelectedRootName('Me')
              } else if (id === '__platform__') {
                setSelectedRootName(platformRootName)
              } else {
                const u = adminUsers.find((x) => x.id === id)
                setSelectedRootName(u?.name ?? id)
              }
            }}
            className="px-3 py-2 rounded-lg border border-slate-600 bg-slate-800 text-white min-w-[240px]"
          >
            <option value="">Me ({user?.name ?? 'You'})</option>
            <option value="__platform__">Entire network (all members)</option>
            {adminUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* View Toggle – Tree View is the default for all accounts */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-400">View:</span>
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              view === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Users className="w-4 h-4" /> List View
          </button>
          <button
            onClick={() => setView('mindmap')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              view === 'mindmap'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Network className="w-4 h-4" /> Tree View
          </button>
        </div>
        <div className="flex-1 max-w-md ml-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input
              type="search"
              placeholder="Search network..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search network by name, email or city"
              className="w-full pl-10 pr-4 py-2 border border-slate-600 rounded-lg bg-slate-800 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Network List */}
      {view === 'list' && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  City
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {filteredDownlines.map((member) => (
                <tr key={member.id} className="hover:bg-slate-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{member.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-300">{member.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-900/50 text-blue-300">
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {member.city || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {new Date(member.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredDownlines.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              No members found in your network
            </div>
          )}
        </div>
      )}

      {/* Tree View – default for all accounts */}
      {view === 'mindmap' && (user?.id || effectiveRootId) && (
        <NetworkTreeView
          meId={user?.id ?? effectiveRootId ?? ''}
          meName={user?.name ?? 'Me'}
          rootId={effectiveRootId ?? undefined}
          rootName={effectiveRootId === user?.id ? undefined : effectiveRootName}
          isAdmin={isAdmin}
          fullNetwork={isEntireNetwork}
        />
      )}
      {view === 'mindmap' && !user?.id && (
        <div className="rounded-2xl bg-slate-800/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-8 text-center">
          <p className="text-slate-400">Loading your network tree…</p>
        </div>
      )}
    </div>
  )
}
