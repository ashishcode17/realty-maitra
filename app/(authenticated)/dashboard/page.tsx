'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, TrendingUp, Award, Calendar, ArrowUpRight, UserPlus } from 'lucide-react'
import { InviteCodeField } from '@/components/InviteCodeField'
import Link from 'next/link'
import { toast } from 'sonner'
import { getRankLabel } from '@/lib/ranks'

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        window.location.href = '/login'
        return
      }

      const headers = {
        'Authorization': `Bearer ${token}`
      }

      const [userRes, statsRes] = await Promise.all([
        fetch('/api/auth/me', { headers }),
        fetch('/api/dashboard/stats', { headers }),
      ])

      if (userRes.ok) {
        const userData = await userRes.json()
        setUser(userData.user)
      }
      
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.stats || {})
      }
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 rounded bg-slate-800 animate-pulse" />
        <div className="grid md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-slate-800 border border-slate-700 animate-pulse" />
          ))}
        </div>
        <div className="h-48 rounded-xl bg-slate-800 border border-slate-700 animate-pulse" />
      </div>
    )
  }

  const rankLabel = user?.rank ? getRankLabel(user.rank) : (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' ? 'Admin' : 'BDM');

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-slate-800/80 border border-slate-700">
        <p className="text-slate-400 text-sm"><strong className="text-slate-300">Position:</strong> {rankLabel}</p>
        {(user?.joinedUnderSponsorName || user?.joinedUnderSponsorCode) && (
          <>
            <p className="text-slate-400 text-sm mt-1"><strong className="text-slate-300">Reporting To:</strong> {user.joinedUnderSponsorName ?? '—'}</p>
            <p className="text-slate-400 text-sm"><strong className="text-slate-300">Sponsor Code:</strong> <span className="font-mono text-slate-200">{user.joinedUnderSponsorCode ?? '—'}</span></p>
          </>
        )}
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Welcome, {user?.name}!</h1>
        <p className="text-slate-400">Your dashboard overview</p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <Users className="h-8 w-8 text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-white">{stats?.networkSize || 0}</p>
            <p className="text-sm text-slate-400">Network Size</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <TrendingUp className="h-8 w-8 text-emerald-500 mb-2" />
            <p className="text-2xl font-bold text-white">₹{stats?.totalEarnings?.toLocaleString() || 0}</p>
            <p className="text-sm text-slate-400">Total Earned</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <Award className="h-8 w-8 text-amber-500 mb-2" />
            <p className="text-2xl font-bold text-white">{rankLabel}</p>
            <p className="text-sm text-slate-400">Position</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <Calendar className="h-8 w-8 text-purple-500 mb-2" />
            <p className="text-2xl font-bold text-white">{stats?.upcomingTrainings || 0}</p>
            <p className="text-sm text-slate-400">Upcoming Trainings</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <Link href="/network">
            <Button variant="outline" className="w-full border-slate-700 text-white hover:bg-slate-700">
              View Network <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/projects">
            <Button variant="outline" className="w-full border-slate-700 text-white hover:bg-slate-700">
              Browse Projects <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/training">
            <Button variant="outline" className="w-full border-slate-700 text-white hover:bg-slate-700">
              Training Center <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/offers">
            <Button variant="outline" className="w-full border-slate-700 text-white hover:bg-slate-700">
              Challenges <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {user?.id && (
        <>
          {(user.joinedUnderSponsorName || user.joinedUnderSponsorCode) && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <UserPlus className="h-5 w-5" /> Team
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-slate-300">
                  You joined under: <span className="font-semibold text-white">{user.joinedUnderSponsorName ?? '—'}</span>
                </p>
                <p className="text-slate-300">
                  Sponsor code: <span className="font-mono text-slate-200">{user.joinedUnderSponsorCode ?? '—'}</span>
                </p>
                <p className="text-slate-500 text-xs mt-2">This is set from your invite code at registration and cannot be changed.</p>
              </CardContent>
            </Card>
          )}
          <Card className="bg-emerald-900/20 border-emerald-800">
            <CardContent className="pt-6">
              <h3 className="text-white font-semibold mb-2">Your Invite Code</h3>
              <InviteCodeField
                code={user.sponsorCode ?? null}
                helperText="Share this code so others can join under you. New code generated after each successful join."
                size="lg"
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
