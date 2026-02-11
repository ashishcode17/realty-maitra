'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Building2, Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'

const PROJECT_TYPES = ['PLOTS', 'VILLAS', 'COMMERCIAL', 'APARTMENTS', 'MIXED'] as const
const PROJECT_STATUSES = ['UPCOMING', 'ACTIVE', 'CLOSED'] as const

interface Project {
  id: string
  name: string
  location: string
  type: string
  status: string
  description?: string | null
  media: string[]
  documents: string[]
  createdAt: string
  slabConfigs: Array<{
    directorPct: number
    vpPct: number
    avpPct: number
    ssmPct: number
    smPct: number
    bdmPct: number
    uplineBonus1Pct: number
    uplineBonus2Pct: number
  }>
  _count?: { leads: number }
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    type: 'PLOTS',
    status: 'UPCOMING',
    description: '',
  })

  const loadProjects = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/projects', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setProjects(data.projects ?? [])
      }
    } catch {
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setFormData({
      name: '',
      location: '',
      type: 'PLOTS',
      status: 'UPCOMING',
      description: '',
    })
    setDialogOpen(true)
  }

  const openEdit = (p: Project) => {
    setEditingId(p.id)
    setFormData({
      name: p.name,
      location: p.location,
      type: p.type,
      status: p.status,
      description: p.description ?? '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const url = editingId
        ? `/api/admin/projects/${editingId}`
        : '/api/admin/projects'
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      toast.success(editingId ? 'Project updated' : 'Project created')
      setDialogOpen(false)
      loadProjects()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project? This cannot be undone.')) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        toast.success('Project deleted')
        loadProjects()
      } else {
        const data = await res.json()
        throw new Error(data.error || 'Delete failed')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-9 w-48 rounded bg-slate-800 animate-pulse" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-slate-800 border border-slate-700 animate-pulse" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Manage Projects</h1>
            <p className="text-slate-400">Create and edit projects</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Project' : 'New Project'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="text-slate-300">Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                    required
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Location</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData((f) => ({ ...f, location: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                    required
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData((f) => ({ ...f, type: v }))}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData((f) => ({ ...f, status: v }))}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Description (optional)</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white mt-1 min-h-[80px]"
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                    {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Card key={p.id} className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <Building2 className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{p.name}</h3>
                      <p className="text-sm text-slate-400">{p.location}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300">{p.type}</span>
                        <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300">{p.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => openEdit(p)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => handleDelete(p.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {projects.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            No projects yet. Create one to get started.
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
