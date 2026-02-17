'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, ChevronLeft, Download, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface LedgerRow {
  id: string
  userId: string
  eventType: string
  timestamp: string
  performedBy: string | null
  name: string | null
  email: string | null
  phone: string | null
  city: string | null
  state: string | null
  rank: string | null
  role: string | null
  treeId: string | null
  profileImageUrl: string | null
  govtIdImageUrl: string | null
  inviterUserId: string | null
  inviterCode: string | null
}

export default function AdminLedgerPage() {
  const [rows, setRows] = useState<LedgerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [eventType, setEventType] = useState('')
  const [treeId, setTreeId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const loadLedger = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (eventType) params.set('eventType', eventType)
      if (treeId) params.set('treeId', treeId)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      if (search) params.set('search', search)
      const res = await fetch(`/api/admin/ledger?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setRows(data.ledger || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLedger()
  }, [])

  const handleExportCsv = async () => {
    const token = localStorage.getItem('token')
    const params = new URLSearchParams()
    if (eventType) params.set('eventType', eventType)
    if (treeId) params.set('treeId', treeId)
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    if (search) params.set('search', search)
    const res = await fetch(`/api/admin/ledger/export?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const csv = await res.text()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `user-ledger-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadGovtId = async (userId: string) => {
    setDownloadingId(userId)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/files/govt-id/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Not found')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `govt-id-${userId}.jpg`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // ignore
    } finally {
      setDownloadingId(null)
    }
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
          <h1 className="text-3xl font-bold text-white">Join / Exit Ledger</h1>
          <p className="text-slate-400">Master register of user entries and exits</p>
        </div>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label className="text-slate-400 text-xs">Event type</Label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full mt-1 rounded-lg border border-slate-600 bg-slate-900 text-white px-3 py-2 text-sm"
              >
                <option value="">All</option>
                <option value="JOINED">JOINED</option>
                <option value="DELETED">DELETED</option>
                <option value="DEACTIVATED">DEACTIVATED</option>
                <option value="REACTIVATED">REACTIVATED</option>
              </select>
            </div>
            <div>
              <Label className="text-slate-400 text-xs">Tree ID</Label>
              <Input
                value={treeId}
                onChange={(e) => setTreeId(e.target.value)}
                placeholder="Optional"
                className="mt-1 bg-slate-900 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-400 text-xs">Date from</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1 bg-slate-900 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-400 text-xs">Date to</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1 bg-slate-900 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-400 text-xs">Search name/email/phone</Label>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="mt-1 bg-slate-900 border-slate-600 text-white"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadLedger} className="bg-emerald-600 hover:bg-emerald-700">
              Apply filters
            </Button>
            <Button onClick={handleExportCsv} variant="outline" className="border-slate-600 text-slate-300">
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-slate-400 py-8 text-center">No ledger entries match the filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-600 text-slate-400">
                    <th className="pb-2 pr-4">Date/Time</th>
                    <th className="pb-2 pr-4">Event</th>
                    <th className="pb-2 pr-4">Name</th>
                    <th className="pb-2 pr-4">Phone</th>
                    <th className="pb-2 pr-4">City</th>
                    <th className="pb-2 pr-4">Rank</th>
                    <th className="pb-2 pr-4">Role</th>
                    <th className="pb-2 pr-4">TreeId</th>
                    <th className="pb-2 pr-4">Issuer/Sponsor</th>
                    <th className="pb-2 pr-4">Govt ID</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-slate-700/50">
                      <td className="py-2 pr-4 text-white whitespace-nowrap">{new Date(r.timestamp).toLocaleString()}</td>
                      <td className="py-2 pr-4 text-slate-300">{r.eventType}</td>
                      <td className="py-2 pr-4 text-white">{r.name ?? '—'}</td>
                      <td className="py-2 pr-4 text-slate-300">{r.phone ?? '—'}</td>
                      <td className="py-2 pr-4 text-slate-300">{r.city ?? '—'}</td>
                      <td className="py-2 pr-4 text-slate-300">{r.rank ?? '—'}</td>
                      <td className="py-2 pr-4 text-slate-300">{r.role ?? '—'}</td>
                      <td className="py-2 pr-4 text-slate-400 font-mono text-xs">{r.treeId ?? '—'}</td>
                      <td className="py-2 pr-4 text-slate-300">{r.inviterCode ?? '—'}</td>
                      <td className="py-2 pr-4">
                        {r.govtIdImageUrl ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-emerald-400 hover:text-emerald-300"
                            disabled={downloadingId === r.userId}
                            onClick={() => downloadGovtId(r.userId)}
                          >
                            {downloadingId === r.userId ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Download'}
                          </Button>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
