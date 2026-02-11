'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Video, FileText, Calendar, Download, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface TrainingContent {
  id: string
  title: string
  category: string
  type: string
  description?: string
  downloadUrl?: string | null
  fileName?: string
  fileSize?: number
  fileType?: string
  videoEmbedUrl?: string
}

interface TrainingSession {
  id: string
  title: string
  mode: string
  startDate: string
  location?: string | null
  meetingLink?: string | null
  endDate?: string | null
  slots?: Array<{
    id: string
    title?: string | null
    startTime: string
    endTime: string
    capacity: number
    bookedCount: number
    available: number
  }>
  description?: string
}

export default function TrainingPage() {
  const [content, setContent] = useState<TrainingContent[]>([])
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'content' | 'sessions'>('content')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      const [contentRes, sessionsRes] = await Promise.all([
        fetch('/api/training/content', { headers }),
        fetch('/api/training/sessions', { headers }),
      ])

      if (contentRes.ok) {
        const contentData = await contentRes.json()
        setContent(contentData.content || [])
      }

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json()
        setSessions(sessionsData.sessions || [])
      }
    } catch (error) {
      toast.error('Failed to load training data')
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return <Video className="w-6 h-6" />
      case 'PDF':
      case 'DOCUMENT':
        return <FileText className="w-6 h-6" />
      default:
        return <BookOpen className="w-6 h-6" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-9 w-48 rounded bg-slate-800" />
          <div className="flex gap-2 border-b border-slate-700 pb-2">
            <div className="h-10 w-36 rounded bg-slate-800" />
            <div className="h-10 w-40 rounded bg-slate-800" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-xl bg-slate-800 border border-slate-700" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Training Center</h1>
          <p className="text-slate-400">Access training materials and book sessions</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'content'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Training Content
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'sessions'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Training Sessions
          </button>
        </div>

        {activeTab === 'content' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.map((item) => (
              <Card key={item.id} className="bg-slate-800 border-slate-700 hover:border-emerald-600 transition">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.type === 'VIDEO' ? (
                        <Video className="h-5 w-5 text-red-500" />
                      ) : (
                        <FileText className="h-5 w-5 text-blue-500" />
                      )}
                      <span className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded">
                        {item.type}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">{item.category}</span>
                  </div>
                  <CardTitle className="text-white">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {item.description && (
                    <p className="text-slate-400 text-sm mb-4 line-clamp-2">{item.description}</p>
                  )}
                  
                  {item.type === 'VIDEO' && item.videoEmbedUrl ? (
                    <div className="mb-4">
                      <iframe
                        src={item.videoEmbedUrl}
                        className="w-full h-48 rounded"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : item.downloadUrl ? (
                    <div className="space-y-2">
                      {item.fileName && (
                        <p className="text-xs text-slate-500">File: {item.fileName}</p>
                      )}
                      {item.fileSize && (
                        <p className="text-xs text-slate-500">
                          Size: {(item.fileSize / 1024 / 1024).toFixed(2)} MB
                        </p>
                      )}
                      <Button
                        onClick={() => {
                          window.open(item.downloadUrl!, '_blank')
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-slate-700 text-slate-300 hover:bg-slate-700"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Mark as Completed
                      </Button>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">No file available</p>
                  )}
                </CardContent>
              </Card>
            ))}

            {content.length === 0 && (
              <Card className="bg-slate-800 border-slate-700 col-span-full">
                <CardContent className="pt-6 text-center text-slate-400">
                  No training content available yet.
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-4">
            {sessions.map((session) => (
              <Card key={session.id} className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Calendar className="w-5 h-5 text-slate-400 mr-2" />
                        <h3 className="text-xl font-semibold text-white">{session.title}</h3>
                      </div>
                      {session.description && (
                        <p className="text-slate-400 mb-4">{session.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span>Mode: {session.mode}</span>
                        <span>
                          Date: {new Date(session.startDate).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Slots */}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                        {(session.slots || []).map((slot) => (
                          <Button
                            key={slot.id}
                            variant="outline"
                            disabled={slot.available <= 0}
                            className="border-slate-700 text-slate-200 hover:bg-slate-700 disabled:opacity-50"
                            onClick={async () => {
                              try {
                                const token = localStorage.getItem('token')
                                const response = await fetch(
                                  `/api/training/sessions/${session.id}/book`,
                                  {
                                    method: 'POST',
                                    headers: {
                                      Authorization: `Bearer ${token}`,
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({ slotId: slot.id }),
                                  }
                                )
                                const data = await response.json()
                                if (response.ok) {
                                  toast.success('Slot booked successfully!')
                                  loadData()
                                } else {
                                  toast.error(data.error || 'Failed to book slot')
                                }
                              } catch {
                                toast.error('Failed to book slot')
                              }
                            }}
                          >
                            <div className="text-left w-full">
                              <div className="text-sm font-medium">
                                {slot.title || 'Slot'}
                              </div>
                              <div className="text-xs text-slate-400">
                                {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                                {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div className="text-xs text-slate-500">
                                Available: {slot.available}/{slot.capacity}
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {sessions.length === 0 && (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6 text-center text-slate-400">
                  No training sessions available yet.
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
  )
}
