'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserPlus, Phone, Mail, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/EmptyState'

interface Lead {
  id: string
  name: string
  phone: string
  email: string | null
  city: string | null
  status: string
  notes: string | null
  nextFollowUpAt: string | null
  project?: { name: string } | null
  updatedAt: string
}

const STAGES = ['NEW', 'CONTACTED', 'SITE_VISIT', 'FOLLOW_UP', 'CONVERTED', 'LOST'] as const

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    loadLeads()
  }, [])

  const loadLeads = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/leads', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setLeads(data.leads || [])
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed to load leads')
    } finally {
      setLoading(false)
    }
  }

  const updateStage = async (leadId: string, status: string) => {
    setUpdatingId(leadId)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        const data = await res.json()
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, ...data.lead } : l))
        )
        toast.success('Stage updated')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Update failed')
      }
    } catch (e) {
      toast.error('Update failed')
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-48 rounded bg-slate-800 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-800 border border-slate-700 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Leads</h1>
        <p className="text-slate-400">Manage your assigned leads</p>
      </div>

      {leads.length === 0 ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-0">
            <EmptyState
              icon={UserPlus}
              title="No leads assigned"
              description="Leads assigned to you will appear here. Contact your admin to get leads."
              variant="dark"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => (
            <Card key={lead.id} className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-white">{lead.name}</h3>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" /> {lead.phone}
                      </span>
                      {lead.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" /> {lead.email}
                        </span>
                      )}
                      {lead.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" /> {lead.city}
                        </span>
                      )}
                    </div>
                    {lead.project?.name && (
                      <p className="text-slate-500 text-sm mt-1">Project: {lead.project.name}</p>
                    )}
                    {lead.notes && (
                      <p className="text-slate-400 text-sm mt-2 max-w-md">{lead.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-sm">Stage:</span>
                    <select
                      value={lead.status}
                      onChange={(e) => updateStage(lead.id, e.target.value)}
                      disabled={updatingId === lead.id}
                      className="bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-white text-sm disabled:opacity-50"
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
