'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

interface AuditEntry {
  id: string
  action: string
  entityType: string
  entityId: string | null
  metaJson: string | null
  ip: string | null
  createdAt: string
  actor: { id: string; name: string; email: string; role: string }
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLogs(1)
  }, [])

  const loadLogs = async (page: number) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/audit?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
        setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
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
          <h1 className="text-3xl font-bold text-white">Audit Log</h1>
          <p className="text-slate-400">Critical actions and changes</p>
        </div>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5" /> Recent activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 rounded bg-slate-700/50 animate-pulse" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-slate-400 py-8 text-center">No audit entries yet.</p>
          ) : (
            <>
              <div className="md:hidden space-y-3">
                {logs.map((log) => {
                  let meta: Record<string, unknown> = {}
                  try {
                    if (log.metaJson) meta = JSON.parse(log.metaJson) as Record<string, unknown>
                  } catch {}
                  return (
                    <div key={log.id} className="p-4 rounded-lg border border-slate-600 bg-slate-800/50">
                      <p className="text-slate-400 text-xs">{new Date(log.createdAt).toLocaleString()}</p>
                      <p className="font-medium text-white mt-0.5">{log.actor?.name}</p>
                      <p className="text-slate-500 text-sm">{log.actor?.email}</p>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded bg-slate-700 text-slate-200 text-xs">{log.action}</span>
                      <p className="text-slate-400 text-sm mt-1">{log.entityType} {log.entityId && <span className="font-mono">{log.entityId.slice(0, 8)}…</span>}</p>
                      {(meta.reason != null || meta.after != null) && (
                        <p className="text-slate-500 text-xs mt-2 truncate max-w-full">{meta.reason != null ? String(meta.reason) : JSON.stringify(meta.after)}</p>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="hidden md:block space-y-2 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-700">
                      <th className="pb-2 pr-4">Time</th>
                      <th className="pb-2 pr-4">Actor</th>
                      <th className="pb-2 pr-4">Action</th>
                      <th className="pb-2 pr-4">Entity</th>
                      <th className="pb-2">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => {
                      let meta: Record<string, unknown> = {}
                      try {
                        if (log.metaJson) meta = JSON.parse(log.metaJson) as Record<string, unknown>
                      } catch {}
                      return (
                        <tr key={log.id} className="border-b border-slate-700/50 text-slate-300">
                          <td className="py-3 pr-4 whitespace-nowrap text-slate-400">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3 pr-4">
                            <span className="font-medium text-white">{log.actor?.name}</span>
                            <span className="text-slate-500 ml-1">({log.actor?.email})</span>
                          </td>
                          <td className="py-3 pr-4">
                            <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-200">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            {log.entityType}
                            {log.entityId && (
                              <span className="text-slate-500 ml-1 font-mono text-xs">
                                {log.entityId.slice(0, 8)}…
                              </span>
                            )}
                          </td>
                          <td className="py-3 max-w-xs">
                            {meta.reason != null && (
                              <span className="text-slate-400">{String(meta.reason)}</span>
                            )}
                            {meta.after != null && (
                              <pre className="text-xs text-slate-500 truncate max-w-[200px]">
                                {JSON.stringify(meta.after)}
                              </pre>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
              <p className="text-slate-400 text-sm">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => loadLogs(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 rounded bg-slate-700 text-slate-300 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => loadLogs(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1 rounded bg-slate-700 text-slate-300 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
