'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Building2, Award, BookOpen, FileText, TrendingUp, ClipboardList, CircleDot } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    activeChallenges: 0,
    trainingSessions: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (response.ok) {
          const data = await response.json()
          if (data.stats) {
            setStats(data.stats)
          }
        }
      } catch (error) {
        console.error('Failed to load stats')
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-9 w-48 rounded bg-slate-800" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-slate-800 border border-slate-700" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-slate-800 border border-slate-700" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-slate-400">Manage the platform</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-slate-400">Total Users</p>
                  <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Building2 className="w-6 h-6 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-slate-400">Projects</p>
                  <p className="text-2xl font-bold text-white">{stats.totalProjects}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-500/20 rounded-lg">
                  <Award className="w-6 h-6 text-yellow-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-slate-400">Active Challenges</p>
                  <p className="text-2xl font-bold text-white">{stats.activeChallenges}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <BookOpen className="w-6 h-6 text-purple-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-slate-400">Training Sessions</p>
                  <p className="text-2xl font-bold text-white">{stats.trainingSessions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/admin/training">
            <Card className="bg-slate-800 border-slate-700 hover:border-emerald-600 transition cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <BookOpen className="w-8 h-8 text-purple-500" />
                  <h3 className="text-xl font-semibold text-white ml-4">Training Center</h3>
                </div>
                <p className="text-slate-400">Upload and manage training content</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/users">
            <Card className="bg-slate-800 border-slate-700 hover:border-emerald-600 transition cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <Users className="w-8 h-8 text-blue-500" />
                  <h3 className="text-xl font-semibold text-white ml-4">Manage Members</h3>
                </div>
                <p className="text-slate-400">View and manage all members, reassign sponsors</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/projects">
            <Card className="bg-slate-800 border-slate-700 hover:border-emerald-600 transition cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <Building2 className="w-8 h-8 text-green-500" />
                  <h3 className="text-xl font-semibold text-white ml-4">Manage Projects</h3>
                </div>
                <p className="text-slate-400">Create and manage projects</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/sessions">
            <Card className="bg-slate-800 border-slate-700 hover:border-emerald-600 transition cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <BookOpen className="w-8 h-8 text-purple-500" />
                  <h3 className="text-xl font-semibold text-white ml-4">Training Sessions</h3>
                </div>
                <p className="text-slate-400">Create and manage sessions and slots</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/analytics">
            <Card className="bg-slate-800 border-slate-700 hover:border-emerald-600 transition cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <TrendingUp className="w-8 h-8 text-emerald-500" />
                  <h3 className="text-xl font-semibold text-white ml-4">Analytics</h3>
                </div>
                <p className="text-slate-400">Platform metrics, earnings by month, recent activity</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/audit">
            <Card className="bg-slate-800 border-slate-700 hover:border-emerald-600 transition cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <FileText className="w-8 h-8 text-amber-500" />
                  <h3 className="text-xl font-semibold text-white ml-4">Audit Log</h3>
                </div>
                <p className="text-slate-400">View critical actions and changes</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/ledger">
            <Card className="bg-slate-800 border-slate-700 hover:border-emerald-600 transition cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <ClipboardList className="w-8 h-8 text-cyan-500" />
                  <h3 className="text-xl font-semibold text-white ml-4">Join/Exit Ledger</h3>
                </div>
                <p className="text-slate-400">Official register of joins, deactivations, exports</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/online">
            <Card className="bg-slate-800 border-slate-700 hover:border-emerald-600 transition cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <CircleDot className="w-8 h-8 text-emerald-500" />
                  <h3 className="text-xl font-semibold text-white ml-4">Online Users</h3>
                </div>
                <p className="text-slate-400">Who is active now (green dot), last seen</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
  )
}
