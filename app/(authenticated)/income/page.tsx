'use client'

import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, Clock, CheckCircle, FileDown, Calendar } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { authHeaders } from '@/lib/authFetch'

interface Earning {
  id: string
  project: { name: string }
  bookingId?: string
  baseAmount: number
  slabPct: number
  calculatedAmount: number
  uplineBonus1: number
  uplineBonus2: number
  totalAmount: number
  status: string
  createdAt: string
}

export default function IncomePage() {
  const [earnings, setEarnings] = useState<Earning[]>([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    paid: 0,
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'PAID'>('all')
  const [statementMonth, setStatementMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [statementSummary, setStatementSummary] = useState<{
    month: string
    totalAmount: number
    count: number
    byStatus: { PENDING: number; APPROVED: number; PAID: number }
  } | null>(null)
  const [statementLoading, setStatementLoading] = useState(false)

  useEffect(() => {
    const headers = authHeaders()
    fetch('/api/income', { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.earnings) {
          setEarnings(data.earnings)
          
          const total = data.earnings.reduce((sum: number, e: Earning) => sum + e.totalAmount, 0)
          const pending = data.earnings
            .filter((e: Earning) => e.status === 'PENDING')
            .reduce((sum: number, e: Earning) => sum + e.totalAmount, 0)
          const approved = data.earnings
            .filter((e: Earning) => e.status === 'APPROVED')
            .reduce((sum: number, e: Earning) => sum + e.totalAmount, 0)
          const paid = data.earnings
            .filter((e: Earning) => e.status === 'PAID')
            .reduce((sum: number, e: Earning) => sum + e.totalAmount, 0)

          setStats({ total, pending, approved, paid })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filteredEarnings = filter === 'all'
    ? earnings
    : earnings.filter(e => e.status === filter)

  const fetchStatement = async (month: string, format: 'json' | 'csv') => {
    const res = await fetch(`/api/income/statement?month=${month}&format=${format}`, { headers: authHeaders() })
    if (!res.ok) return null
    if (format === 'csv') {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `statement-${month}.csv`
      a.click()
      URL.revokeObjectURL(url)
      return true
    }
    const data = await res.json()
    if (data.statement?.summary) setStatementSummary(data.statement.summary)
    return data
  }

  const handleViewStatement = () => {
    setStatementLoading(true)
    fetchStatement(statementMonth, 'json').finally(() => setStatementLoading(false))
  }

  const handleDownloadCSV = () => {
    fetchStatement(statementMonth, 'csv')
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-9 w-56 rounded bg-slate-800" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-lg bg-slate-800 border border-slate-700" />
            ))}
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-20 rounded-lg bg-slate-800" />
            ))}
          </div>
          <div className="h-64 rounded-lg bg-slate-800 border border-slate-700" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Income & Rewards</h1>
        <p className="mt-2 text-slate-400">Track your earnings and performance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-400">Total Earned</p>
              <p className="text-2xl font-bold text-white">₹{stats.total.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-400">Pending</p>
              <p className="text-2xl font-bold text-white">₹{stats.pending.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-400">Approved</p>
              <p className="text-2xl font-bold text-white">₹{stats.approved.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-400">Paid Out</p>
              <p className="text-2xl font-bold text-white">₹{stats.paid.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly statement / CSV */}
      <div className="mb-8 p-4 rounded-lg bg-slate-800/80 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-slate-400" /> Monthly statement
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="month"
            value={statementMonth}
            onChange={(e) => setStatementMonth(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white text-sm"
          />
          <button
            onClick={handleViewStatement}
            disabled={statementLoading}
            className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-50 text-sm"
          >
            {statementLoading ? 'Loading…' : 'View summary'}
          </button>
          <button
            onClick={handleDownloadCSV}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 flex items-center gap-2 text-sm"
          >
            <FileDown className="h-4 w-4" /> Download CSV
          </button>
        </div>
        {statementSummary && (
          <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-400">Month</p>
              <p className="font-medium text-white">{statementSummary.month}</p>
            </div>
            <div>
              <p className="text-slate-400">Total</p>
              <p className="font-medium text-white">₹{statementSummary.totalAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-400">Entries</p>
              <p className="font-medium text-white">{statementSummary.count}</p>
            </div>
            <div>
              <p className="text-slate-400">By status</p>
              <p className="text-slate-300">P: ₹{statementSummary.byStatus.PENDING.toLocaleString()} · A: ₹{statementSummary.byStatus.APPROVED.toLocaleString()} · Paid: ₹{statementSummary.byStatus.PAID.toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('PENDING')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'PENDING'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter('APPROVED')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'APPROVED'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setFilter('PAID')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'PAID'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
          }`}
        >
          Paid
        </button>
      </div>

      {/* Earnings Table or Empty State */}
      {filteredEarnings.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <EmptyState
            icon={DollarSign}
            title="No earnings found"
            description={
              filter === 'all'
                ? 'Earnings will appear here when you have bookings and commissions. Grow your network and close deals to earn.'
                : `No ${filter.toLowerCase()} earnings. Try "All" to see everything.`
            }
            actionLabel={filter === 'all' ? 'View Projects' : 'Show all'}
            actionHref={filter === 'all' ? '/projects' : undefined}
            onAction={filter === 'all' ? undefined : () => setFilter('all')}
            variant="dark"
          />
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          {/* Card layout on mobile (same data, better touch) */}
          <div className="md:hidden divide-y divide-slate-700">
            {filteredEarnings.map((earning) => (
              <div key={earning.id} className="p-4 bg-slate-800/50 hover:bg-slate-700/30">
                <div className="flex justify-between items-start gap-2">
                  <p className="font-medium text-white">{earning.project.name}</p>
                  <span
                    className={`shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full ${
                      earning.status === 'PAID' ? 'bg-green-500/20 text-green-400' : earning.status === 'APPROVED' ? 'bg-blue-500/20 text-blue-400' : earning.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {earning.status}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-0.5">{new Date(earning.createdAt).toLocaleDateString()} · {earning.bookingId || '—'}</p>
                <p className="text-slate-300 text-sm mt-1">Base ₹{earning.baseAmount.toLocaleString()} · {earning.slabPct}% → <span className="font-semibold text-white">₹{earning.totalAmount.toLocaleString()}</span></p>
              </div>
            ))}
          </div>
          {/* Table on md and up */}
          <table className="min-w-full divide-y divide-slate-700 hidden md:table">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Booking ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Base Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Slab %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-slate-800/50 divide-y divide-slate-700">
              {filteredEarnings.map((earning) => (
                <tr key={earning.id} className="hover:bg-slate-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {new Date(earning.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {earning.project.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {earning.bookingId || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    ₹{earning.baseAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {earning.slabPct}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">
                    ₹{earning.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        earning.status === 'PAID'
                          ? 'bg-green-500/20 text-green-400'
                          : earning.status === 'APPROVED'
                          ? 'bg-blue-500/20 text-blue-400'
                          : earning.status === 'PENDING'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {earning.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
