'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { authHeaders } from '@/lib/authFetch'

interface Notification {
  id: string
  title: string
  body: string
  type: string
  priority: string
  link?: string | null
  createdAt: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/notifications/global', { headers: authHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.notifications) setNotifications(data.notifications)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
          <p className="text-slate-400">View all your notifications</p>
        </div>
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-10 w-48 rounded bg-slate-800" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-slate-800 border border-slate-700" />
              ))}
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-0">
              <EmptyState
                icon={Bell}
                title="No notifications yet"
                description="When you have new updates, they'll show up here."
                actionLabel="Go to Dashboard"
                actionHref="/dashboard"
                variant="dark"
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <Card key={n.id} className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-white">{n.title}</h3>
                      <p className="text-slate-400 text-sm mt-1">{n.body}</p>
                      <p className="text-slate-500 text-xs mt-2">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {n.link && (
                      <Link
                        href={n.link}
                        className="shrink-0 text-emerald-500 hover:text-emerald-400 text-sm font-medium"
                      >
                        View →
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
  )
}
