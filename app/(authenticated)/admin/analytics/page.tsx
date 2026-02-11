'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart3,
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  ChevronLeft,
  FileText,
  Clock,
} from 'lucide-react'
import Link from 'next/link'

interface Analytics {
  periodDays: number
  since: string
  totals: {
    users: number
    projects: number
    earningsApprovedOrPaid: number
    earningsPending: number
  }
  inPeriod: {
    usersCreated: number
    earningsTotal: number
    earningsByStatus: { PENDING: number; APPROVED: number; PAID: number }
  }
  earningsByMonth: { month: string; total: number; count: number }[]
  recentUsers: { id: string; name: string; email: string; role: string; createdAt: string }[]
  recentEarnings: {
    id: string
    totalAmount: number
    status: string
    createdAt: string
    project: { name: string }
    user: { name: string }
  }[]
  recentAuditLogs: {
    id: string
    action: string
    entityType: string
    entityId: string | null
    actorName: string | null
    createdAt: string
  }[]
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(30)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch(`/api/admin/analytics?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.analytics) setData(json.analytics)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [period])

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-48 rounded bg-slate-800 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-800 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const a = data!

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="rounded-lg border border-slate-600 p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Analytics</h1>
            <p className="text-slate-400">Platform metrics and activity</p>
          </div>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setPeriod(d)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                period === d
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              Last {d} days
            </button>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-slate-400">Total users</p>
                <p className="text-2xl font-bold text-white">{a.totals.users}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Building2 className="w-6 h-6 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-slate-400">Projects</p>
                <p className="text-2xl font-bold text-white">{a.totals.projects}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-3 bg-emerald-500/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-slate-400">Earnings (approved/paid)</p>
                <p className="text-2xl font-bold text-white">₹{a.totals.earningsApprovedOrPaid.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-3 bg-amber-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-amber-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-slate-400">Pending earnings</p>
                <p className="text-2xl font-bold text-white">₹{a.totals.earningsPending.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* In period */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> In last {a.periodDays} days
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-400">New users</p>
              <p className="text-xl font-semibold text-white">{a.inPeriod.usersCreated}</p>
            </div>
            <div>
              <p className="text-slate-400">Earnings total</p>
              <p className="text-xl font-semibold text-white">₹{a.inPeriod.earningsTotal.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-400">Pending</p>
              <p className="text-lg font-medium text-amber-400">₹{a.inPeriod.earningsByStatus.PENDING.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-400">Approved + Paid</p>
              <p className="text-lg font-medium text-emerald-400">
                ₹{(a.inPeriod.earningsByStatus.APPROVED + a.inPeriod.earningsByStatus.PAID).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earnings by month */}
      {a.earningsByMonth.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> Earnings by month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-left text-slate-400">
                    <th className="pb-2 pr-4">Month</th>
                    <th className="pb-2 pr-4">Total (₹)</th>
                    <th className="pb-2">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {a.earningsByMonth.map((row) => (
                    <tr key={row.month}>
                      <td className="py-2 pr-4 font-medium text-white">{row.month}</td>
                      <td className="py-2 pr-4 text-slate-300">₹{Number(row.total).toLocaleString()}</td>
                      <td className="py-2 text-slate-400">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent users */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-base">Recent users</CardTitle>
          </CardHeader>
          <CardContent>
            {a.recentUsers.length === 0 ? (
              <p className="text-slate-500 text-sm">None in period</p>
            ) : (
              <ul className="space-y-2">
                {a.recentUsers.map((u) => (
                  <li key={u.id} className="flex justify-between text-sm">
                    <span className="text-white truncate">{u.name}</span>
                    <Link href={`/admin/users/${u.id}`} className="text-emerald-400 hover:underline shrink-0 ml-2">
                      Edit
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent earnings */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-base">Recent earnings</CardTitle>
          </CardHeader>
          <CardContent>
            {a.recentEarnings.length === 0 ? (
              <p className="text-slate-500 text-sm">None in period</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {a.recentEarnings.map((e) => (
                  <li key={e.id} className="flex justify-between">
                    <span className="text-slate-300 truncate">{e.user.name} · {e.project.name}</span>
                    <span className="text-white font-medium shrink-0 ml-2">₹{e.totalAmount.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent audit */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <FileText className="h-4 w-4" /> Recent audit
            </CardTitle>
          </CardHeader>
          <CardContent>
            {a.recentAuditLogs.length === 0 ? (
              <p className="text-slate-500 text-sm">No entries</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {a.recentAuditLogs.map((l) => (
                  <li key={l.id} className="text-slate-300">
                    <span className="text-white font-medium">{l.action}</span>
                    {' · '}
                    {l.entityType} {l.actorName && `by ${l.actorName}`}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
