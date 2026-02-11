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
import { Calendar, Plus, Pencil, Trash2, MapPin, Video } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'

interface SlotForm {
  id?: string
  title: string
  startTime: string
  endTime: string
  capacity: number
}

interface Session {
  id: string
  title: string
  mode: string
  location?: string | null
  meetingLink?: string | null
  description?: string | null
  startDate: string
  endDate?: string | null
  slotCapacity: number
  isActive: boolean
  createdAt: string
  slots: Array<{
    id: string
    title?: string | null
    startTime: string
    endTime: string
    capacity: number
    bookedCount: number
    available: number
  }>
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    mode: 'ONLINE',
    location: '',
    meetingLink: '',
    description: '',
    startDate: '',
    endDate: '',
    slotCapacity: 50,
    isActive: true,
  })
  const [slots, setSlots] = useState<SlotForm[]>([
    { title: 'Slot 1', startTime: '', endTime: '', capacity: 20 },
  ])

  const loadSessions = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/training/sessions', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions ?? [])
      }
    } catch {
      toast.error('Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [])

  const openCreate = () => {
    setEditingId(null)
    const base = new Date()
    base.setHours(10, 0, 0, 0)
    const end = new Date(base)
    end.setHours(11, 0, 0, 0)
    setFormData({
      title: '',
      mode: 'ONLINE',
      location: '',
      meetingLink: '',
      description: '',
      startDate: base.toISOString().slice(0, 16),
      endDate: '',
      slotCapacity: 50,
      isActive: true,
    })
    setSlots([
      {
        title: 'Slot 1',
        startTime: base.toISOString().slice(0, 16),
        endTime: end.toISOString().slice(0, 16),
        capacity: 20,
      },
    ])
    setDialogOpen(true)
  }

  const openEdit = (s: Session) => {
    setEditingId(s.id)
    setFormData({
      title: s.title,
      mode: s.mode,
      location: s.location ?? '',
      meetingLink: s.meetingLink ?? '',
      description: s.description ?? '',
      startDate: new Date(s.startDate).toISOString().slice(0, 16),
      endDate: s.endDate ? new Date(s.endDate).toISOString().slice(0, 16) : '',
      slotCapacity: s.slotCapacity,
      isActive: s.isActive,
    })
    setSlots(
      s.slots.length > 0
        ? s.slots.map((slot) => ({
            id: slot.id,
            title: slot.title ?? '',
            startTime: new Date(slot.startTime).toISOString().slice(0, 16),
            endTime: new Date(slot.endTime).toISOString().slice(0, 16),
            capacity: slot.capacity,
          }))
        : [{ title: 'Slot 1', startTime: '', endTime: '', capacity: 20 }]
    )
    setDialogOpen(true)
  }

  const addSlot = () => {
    setSlots((prev) => [
      ...prev,
      { title: `Slot ${prev.length + 1}`, startTime: '', endTime: '', capacity: 20 },
    ])
  }

  const removeSlot = (i: number) => {
    if (slots.length <= 1) return
    setSlots((prev) => prev.filter((_, idx) => idx !== i))
  }

  const updateSlot = (i: number, field: keyof SlotForm, value: string | number) => {
    setSlots((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: value }
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const payload = {
        ...formData,
        location: formData.location || undefined,
        meetingLink: formData.meetingLink || undefined,
        description: formData.description || undefined,
        endDate: formData.endDate || undefined,
        slots: slots.map((s) => ({
          id: s.id,
          title: s.title || undefined,
          startTime: new Date(s.startTime).toISOString(),
          endTime: new Date(s.endTime).toISOString(),
          capacity: s.capacity,
        })),
      }
      const url = editingId
        ? `/api/admin/training/sessions/${editingId}`
        : '/api/admin/training/sessions'
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      toast.success(editingId ? 'Session updated' : 'Session created')
      setDialogOpen(false)
      loadSessions()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this session? Bookings will be removed. This cannot be undone.')) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/training/sessions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        toast.success('Session deleted')
        loadSessions()
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
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 rounded-xl bg-slate-800 border border-slate-700 animate-pulse" />
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
            <h1 className="text-3xl font-bold text-white mb-2">Training Sessions</h1>
            <p className="text-slate-400">Create and manage training sessions and slots</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="mr-2 h-4 w-4" />
                New Session
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Session' : 'New Session'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="text-slate-300">Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                    required
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Mode</Label>
                  <Select
                    value={formData.mode}
                    onValueChange={(v) => setFormData((f) => ({ ...f, mode: v }))}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONLINE">Online</SelectItem>
                      <SelectItem value="OFFLINE">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Start date & time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData((f) => ({ ...f, startDate: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                    required
                  />
                </div>
                <div>
                  <Label className="text-slate-300">End date (optional)</Label>
                  <Input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData((f) => ({ ...f, endDate: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                  />
                </div>
                {formData.mode === 'OFFLINE' && (
                  <div>
                    <Label className="text-slate-300">Location</Label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData((f) => ({ ...f, location: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white mt-1"
                    />
                  </div>
                )}
                {formData.mode === 'ONLINE' && (
                  <div>
                    <Label className="text-slate-300">Meeting link</Label>
                    <Input
                      value={formData.meetingLink}
                      onChange={(e) => setFormData((f) => ({ ...f, meetingLink: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white mt-1"
                      placeholder="https://..."
                    />
                  </div>
                )}
                <div>
                  <Label className="text-slate-300">Description (optional)</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white mt-1 min-h-[60px]"
                  />
                </div>
                {editingId && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData((f) => ({ ...f, isActive: e.target.checked }))}
                      className="rounded border-slate-600 bg-slate-700"
                    />
                    <Label htmlFor="isActive" className="text-slate-300">Active (visible to users)</Label>
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-slate-300">Slots</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addSlot}>
                      Add slot
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {slots.map((slot, i) => (
                      <div key={i} className="flex gap-2 items-end flex-wrap p-2 rounded bg-slate-700/50">
                        <Input
                          placeholder="Slot title"
                          value={slot.title}
                          onChange={(e) => updateSlot(i, 'title', e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white w-24"
                        />
                        <Input
                          type="datetime-local"
                          value={slot.startTime}
                          onChange={(e) => updateSlot(i, 'startTime', e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white flex-1 min-w-[140px]"
                          required
                        />
                        <Input
                          type="datetime-local"
                          value={slot.endTime}
                          onChange={(e) => updateSlot(i, 'endTime', e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white flex-1 min-w-[140px]"
                          required
                        />
                        <Input
                          type="number"
                          min={1}
                          value={slot.capacity}
                          onChange={(e) => updateSlot(i, 'capacity', parseInt(e.target.value, 10) || 20)}
                          className="bg-slate-700 border-slate-600 text-white w-20"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-red-400 shrink-0"
                          onClick={() => removeSlot(i)}
                          disabled={slots.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
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

        <div className="grid gap-4 md:grid-cols-2">
          {sessions.map((s) => (
            <Card key={s.id} className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      {s.mode === 'ONLINE' ? (
                        <Video className="w-6 h-6 text-purple-500" />
                      ) : (
                        <MapPin className="w-6 h-6 text-purple-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{s.title}</h3>
                      <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(s.startDate).toLocaleString()}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300">{s.mode}</span>
                        {!s.isActive && (
                          <span className="px-2 py-0.5 rounded text-xs bg-amber-900/50 text-amber-400">Inactive</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {s.slots.length} slot(s) · {s.slots.reduce((a, sl) => a + sl.bookedCount, 0)} booked
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => openEdit(s)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => handleDelete(s.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {sessions.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            No sessions yet. Create one to get started.
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
