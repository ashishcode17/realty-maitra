'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { MapPin, Building2, FileText, Percent } from 'lucide-react'
import { authHeaders } from '@/lib/authFetch'

interface Project {
  id: string
  name: string
  location: string
  type: string
  status: string
  description?: string
  media: string[]
  documents: string[]
}

interface SlabConfig {
  directorPct: number
  vpPct: number
  avpPct: number
  ssmPct: number
  smPct: number
  bdmPct: number
  uplineBonus1Pct: number
  uplineBonus2Pct: number
}

export default function ProjectDetailPage() {
  const params = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [slab, setSlab] = useState<SlabConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetch(`/api/projects/${params.id}`, { headers: authHeaders() })
        .then((res) => res.json())
        .then((data) => {
          if (data.project) {
            setProject(data.project)
            setSlab(data.slab)
          }
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-9 w-2/3 rounded bg-slate-800" />
          <div className="flex gap-4">
            <div className="h-5 w-32 rounded bg-slate-800" />
            <div className="h-5 w-24 rounded bg-slate-800" />
          </div>
          <div className="h-48 rounded-lg bg-slate-800 border border-slate-700" />
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 py-12 text-center">
          <p className="text-slate-400">Project not found</p>
          <a href="/projects" className="mt-4 inline-block text-emerald-400 hover:text-emerald-300 font-medium">
            ← Back to Projects
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">{project.name}</h1>
        <div className="mt-4 flex items-center gap-4 text-slate-400">
          <div className="flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-slate-500" />
            {project.location}
          </div>
          <div className="flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-slate-500" />
            {project.type}
          </div>
          <span
            className={`px-3 py-1 text-sm font-medium rounded ${
              project.status === 'ACTIVE'
                ? 'bg-emerald-500/20 text-emerald-400'
                : project.status === 'UPCOMING'
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-slate-600 text-slate-300'
            }`}
          >
            {project.status}
          </span>
        </div>
      </div>

      {/* Media Gallery */}
      {project.media && project.media.length > 0 && (
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.media.map((url, index) => (
              <div key={index} className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-slate-800">
                <Image
                  src={url}
                  alt={`${project.name} - Image ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {project.description && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Overview</h2>
          <p className="text-slate-300 leading-relaxed">{project.description}</p>
        </div>
      )}

      {/* Slab Configuration */}
      {slab && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
          <div className="flex items-center mb-6">
            <Percent className="w-6 h-6 text-blue-400 mr-2" />
            <h2 className="text-xl font-semibold text-white">Company Slab / Allocation Slab</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Allocation %</th>
                </tr>
              </thead>
              <tbody className="bg-slate-800/50 divide-y divide-slate-700">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">DIRECTOR</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{slab.directorPct}%</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">VP</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{slab.vpPct}%</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">AVP</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{slab.avpPct}%</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">SSM</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{slab.ssmPct}%</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">SM</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{slab.smPct}%</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">BDM</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{slab.bdmPct}%</td>
                </tr>
                <tr className="bg-slate-700/30">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-200">Upline Bonus (1st)</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{slab.uplineBonus1Pct}%</td>
                </tr>
                <tr className="bg-slate-700/30">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-200">Upline Bonus (2nd)</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{slab.uplineBonus2Pct}%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            * Upline bonuses apply to the two direct uplines above a BDM, if they exist.
          </p>
        </div>
      )}

      {/* Documents */}
      {project.documents && project.documents.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <FileText className="w-6 h-6 text-blue-400 mr-2" />
            <h2 className="text-xl font-semibold text-white">Documents</h2>
          </div>
          <div className="space-y-2">
            {project.documents.map((doc, index) => (
              <a
                key={index}
                href={doc}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 border border-slate-600 rounded-lg hover:bg-slate-700/50 transition text-slate-200 hover:text-white"
              >
                <div className="flex items-center justify-between">
                  <span>Document {index + 1}</span>
                  <span className="text-emerald-400 text-sm">Download →</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
