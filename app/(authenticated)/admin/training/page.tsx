'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Upload, X, FileText, Video, Download, Trash2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export default function AdminTrainingPage() {
  const [contents, setContents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingContent, setEditingContent] = useState<any | null>(null)
  const [uploading, setUploading] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    type: '',
    description: '',
    projectId: '',
    videoEmbedUrl: '',
  })
  const [editFormData, setEditFormData] = useState({
    title: '',
    category: '',
    type: '',
    description: '',
    videoEmbedUrl: '',
    isActive: true,
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    loadContents()
  }, [])

  const loadContents = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/training/content', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setContents(data.contents || [])
      }
    } catch (error) {
      toast.error('Failed to load training content')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      // Validate file size (25MB)
      if (file.size > 25 * 1024 * 1024) {
        toast.error('File size must be less than 25MB')
        return
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
      ]

      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Allowed: PDF, PPT, DOC, XLS, JPG, PNG')
        return
      }

      setSelectedFile(file)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    try {
      const token = localStorage.getItem('token')
      const uploadFormData = new FormData()
      
      uploadFormData.append('title', formData.title)
      uploadFormData.append('category', formData.category)
      uploadFormData.append('type', formData.type)
      uploadFormData.append('description', formData.description)
      
      if (formData.type === 'VIDEO') {
        uploadFormData.append('videoEmbedUrl', formData.videoEmbedUrl)
      } else {
        if (!selectedFile) {
          toast.error('Please select a file')
          setUploading(false)
          return
        }
        uploadFormData.append('file', selectedFile)
      }

      if (formData.projectId) {
        uploadFormData.append('projectId', formData.projectId)
      }

      const response = await fetch('/api/admin/training/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: uploadFormData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      toast.success('Training content uploaded successfully!')
      setUploadDialogOpen(false)
      setFormData({
        title: '',
        category: '',
        type: '',
        description: '',
        projectId: '',
        videoEmbedUrl: '',
      })
      setSelectedFile(null)
      loadContents()
    } catch (error: any) {
      toast.error(error.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/training/content?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        toast.success('Content deleted')
        loadContents()
      } else {
        throw new Error('Delete failed')
      }
    } catch (error) {
      toast.error('Failed to delete content')
    }
  }

  const openEdit = (content: any) => {
    setEditingContent(content)
    setEditFormData({
      title: content.title ?? '',
      category: content.category ?? '',
      type: content.type ?? '',
      description: content.description ?? '',
      videoEmbedUrl: content.videoEmbedUrl ?? '',
      isActive: content.isActive !== false,
    })
    setEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingContent?.id) return
    setSavingEdit(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/training/content/${editingContent.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Update failed')
      toast.success('Content updated')
      setEditDialogOpen(false)
      setEditingContent(null)
      loadContents()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update content')
    } finally {
      setSavingEdit(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-white">Loading...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Training Content</h1>
            <p className="text-slate-400">Manage training materials and documents</p>
          </div>

          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Upload className="mr-2 h-4 w-4" />
                Upload Content
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Upload Training Content</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="bg-slate-900 border-slate-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                      required
                    >
                      <SelectTrigger className="bg-slate-900 border-slate-700">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ONBOARDING">Onboarding</SelectItem>
                        <SelectItem value="SALES">Sales</SelectItem>
                        <SelectItem value="PROJECTS">Projects</SelectItem>
                        <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                        <SelectItem value="SCRIPTS">Scripts</SelectItem>
                        <SelectItem value="TOOLS">Tools</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Content Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                      required
                    >
                      <SelectTrigger className="bg-slate-900 border-slate-700">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PDF">PDF</SelectItem>
                        <SelectItem value="DOCUMENT">Document</SelectItem>
                        <SelectItem value="PPT">PowerPoint</SelectItem>
                        <SelectItem value="DOCX">Word Document</SelectItem>
                        <SelectItem value="XLS">Excel</SelectItem>
                        <SelectItem value="IMAGE">Image</SelectItem>
                        <SelectItem value="VIDEO">Video (Embed)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.type === 'VIDEO' ? (
                  <div>
                    <Label>Video Embed URL *</Label>
                    <Input
                      value={formData.videoEmbedUrl}
                      onChange={(e) => setFormData({ ...formData, videoEmbedUrl: e.target.value })}
                      placeholder="https://www.youtube.com/embed/..."
                      required
                      className="bg-slate-900 border-slate-700"
                    />
                  </div>
                ) : (
                  <div>
                    <Label>File * (Max 25MB)</Label>
                    <Input
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      required={formData.type !== 'VIDEO'}
                      className="bg-slate-900 border-slate-700"
                    />
                    {selectedFile && (
                      <p className="text-sm text-slate-400 mt-1">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-slate-900 border-slate-700"
                    rows={3}
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={uploading}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setUploadDialogOpen(false)}
                    className="border-slate-700"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Training Content</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <Label className="text-slate-300">Title *</Label>
                  <Input
                    value={editFormData.title}
                    onChange={(e) => setEditFormData((f) => ({ ...f, title: e.target.value }))}
                    required
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Category *</Label>
                    <Select
                      value={editFormData.category}
                      onValueChange={(v) => setEditFormData((f) => ({ ...f, category: v }))}
                      required
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ONBOARDING">Onboarding</SelectItem>
                        <SelectItem value="SALES">Sales</SelectItem>
                        <SelectItem value="PROJECTS">Projects</SelectItem>
                        <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                        <SelectItem value="SCRIPTS">Scripts</SelectItem>
                        <SelectItem value="TOOLS">Tools</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-slate-300">Content Type *</Label>
                    <Select
                      value={editFormData.type}
                      onValueChange={(v) => setEditFormData((f) => ({ ...f, type: v }))}
                      required
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PDF">PDF</SelectItem>
                        <SelectItem value="DOCUMENT">Document</SelectItem>
                        <SelectItem value="PPT">PowerPoint</SelectItem>
                        <SelectItem value="DOCX">Word Document</SelectItem>
                        <SelectItem value="XLS">Excel</SelectItem>
                        <SelectItem value="IMAGE">Image</SelectItem>
                        <SelectItem value="VIDEO">Video (Embed)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {editFormData.type === 'VIDEO' && (
                  <div>
                    <Label className="text-slate-300">Video Embed URL *</Label>
                    <Input
                      value={editFormData.videoEmbedUrl}
                      onChange={(e) => setEditFormData((f) => ({ ...f, videoEmbedUrl: e.target.value }))}
                      placeholder="https://www.youtube.com/embed/..."
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                )}
                <div>
                  <Label className="text-slate-300">Description</Label>
                  <Textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData((f) => ({ ...f, description: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    rows={3}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editIsActive"
                    checked={editFormData.isActive}
                    onChange={(e) => setEditFormData((f) => ({ ...f, isActive: e.target.checked }))}
                    className="rounded border-slate-600 bg-slate-700"
                  />
                  <Label htmlFor="editIsActive" className="text-slate-300">Active (visible to users)</Label>
                </div>
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={savingEdit}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {savingEdit ? 'Saving...' : 'Save changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditDialogOpen(false)}
                    className="border-slate-600 text-slate-200"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {contents.map((content) => (
            <Card key={content.id} className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {content.type === 'VIDEO' ? (
                        <Video className="h-5 w-5 text-red-500" />
                      ) : (
                        <FileText className="h-5 w-5 text-blue-500" />
                      )}
                      <h3 className="text-lg font-semibold text-white">{content.title}</h3>
                      <span className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded">
                        {content.type}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">{content.description}</p>
                    <div className="flex gap-4 text-xs text-slate-500">
                      <span>Category: {content.category}</span>
                      {content.fileSize && (
                        <span>Size: {(content.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                      )}
                      {content.fileName && <span>File: {content.fileName}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={() => openEdit(content)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    {content.filePath && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          window.open(`/api/files/download?id=${content.id}`, '_blank')
                        }}
                        className="border-slate-600 text-slate-200 hover:bg-slate-700"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(content.id)}
                      className="border-red-700 text-red-400 hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {contents.length === 0 && (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6 text-center text-slate-400">
                No training content yet. Upload your first file!
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
