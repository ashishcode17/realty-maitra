'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Building2 } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { authHeaders } from '@/lib/authFetch'

interface Project {
  id: string
  name: string
  location: string
  type: string
  status: string
  description?: string
  media: string[]
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'ACTIVE' | 'UPCOMING' | 'CLOSED'>('all')

  useEffect(() => {
    fetch('/api/projects', { headers: authHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.projects) {
          setProjects(data.projects)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filteredProjects = filter === 'all' 
    ? projects 
    : projects.filter(p => p.status === filter)

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-9 w-48 rounded bg-slate-800" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-20 rounded-lg bg-slate-800" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-lg bg-slate-800 border border-slate-700" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Projects</h1>
        <p className="mt-2 text-slate-400">Explore available real estate projects</p>
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
          onClick={() => setFilter('ACTIVE')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'ACTIVE'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('UPCOMING')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'UPCOMING'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilter('CLOSED')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'CLOSED'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
          }`}
        >
          Closed
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="bg-slate-800 border border-slate-700 rounded-lg shadow-md overflow-hidden hover:shadow-lg hover:border-slate-600 transition text-white"
          >
            {project.media && project.media.length > 0 ? (
              <div className="relative w-full h-48">
                <Image
                  src={project.media[0]}
                  alt={project.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-48 bg-slate-700 flex items-center justify-center">
                <Building2 className="w-16 h-16 text-slate-500" />
              </div>
            )}
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold text-white">{project.name}</h3>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    project.status === 'ACTIVE'
                      ? 'bg-green-900/50 text-green-300'
                      : project.status === 'UPCOMING'
                      ? 'bg-blue-900/50 text-blue-300'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {project.status}
                </span>
              </div>
              <div className="flex items-center text-slate-400 text-sm mb-2">
                <MapPin className="w-4 h-4 mr-1" />
                {project.location}
              </div>
              <div className="flex items-center text-slate-400 text-sm mb-4">
                <Building2 className="w-4 h-4 mr-1" />
                {project.type}
              </div>
              {project.description && (
                <p className="text-slate-400 text-sm line-clamp-2">{project.description}</p>
              )}
              <div className="mt-4">
                <span className="text-blue-400 font-medium text-sm hover:text-blue-300">
                  View Details →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50">
          <EmptyState
            icon={Building2}
            title="No projects found"
            description={
              filter === 'all'
                ? 'No projects are available yet. Check back later or contact your admin.'
                : `No ${filter.toLowerCase()} projects at the moment. Try "All" to see everything.`
            }
            actionLabel={filter === 'all' ? 'Go to Dashboard' : 'Show all projects'}
            actionHref={filter === 'all' ? '/dashboard' : undefined}
            onAction={filter === 'all' ? undefined : () => setFilter('all')}
            variant="dark"
          />
        </div>
      )}
    </div>
  )
}
