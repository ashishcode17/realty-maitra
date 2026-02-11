'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface Notification {
  id: string
  title: string
  body: string
  type: string
  priority: string
  link?: string
  expiresAt?: string
}

export default function HotNoticeBar() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [dismissed, setDismissed] = useState<string[]>([])

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    fetch('/api/notifications/global', { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.notifications) {
          setNotifications(data.notifications)
        }
      })
      .catch(console.error)
  }, [])

  const activeNotifications = notifications.filter(
    (n) => !dismissed.includes(n.id) && (!n.expiresAt || new Date(n.expiresAt) > new Date())
  )

  if (activeNotifications.length === 0) return null

  const topNotification = activeNotifications[0]

  const getBgColor = () => {
    switch (topNotification.priority) {
      case 'CRITICAL':
        return 'bg-red-600'
      case 'HIGH':
        return 'bg-orange-500'
      case 'MEDIUM':
        return 'bg-blue-600'
      default:
        return 'bg-gray-700'
    }
  }

  return (
    <div className={`${getBgColor()} text-white py-2 px-4`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex-1">
          {topNotification.link ? (
            <a
              href={topNotification.link}
              className="block hover:underline"
            >
              <strong>{topNotification.title}:</strong> {topNotification.body}
            </a>
          ) : (
            <div>
              <strong>{topNotification.title}:</strong> {topNotification.body}
            </div>
          )}
        </div>
        <button
          onClick={() => setDismissed([...dismissed, topNotification.id])}
          className="ml-4 hover:opacity-80"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
