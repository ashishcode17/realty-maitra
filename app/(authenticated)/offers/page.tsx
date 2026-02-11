'use client'

import { useEffect, useState } from 'react'
import { Award, Trophy, Users } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { EmptyState } from '@/components/EmptyState'

interface Challenge {
  id: string
  title: string
  reward: string
  requirementsJson: string
  startDate: string
  endDate: string
  enrollments?: Array<{
    id: string
    user: { name: string; role: string; city?: string }
    status: string
    progressJson: string
    enrolledAt: string
  }>
}

export default function OffersPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [myEnrollments, setMyEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'challenges' | 'wall'>('challenges')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    fetch('/api/offers/challenges', { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.challenges) {
          setChallenges(data.challenges)
        }
      })

    fetch('/api/offers/my-enrollments', { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.enrollments) {
          setMyEnrollments(data.enrollments)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleTakeChallenge = async (challengeId: string) => {
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch(`/api/offers/challenges/${challengeId}/enroll`, {
        method: 'POST',
        headers,
      })
      const data = await res.json()

      if (data.success) {
        toast.success('Challenge accepted! Good luck!')
        window.location.reload()
      } else {
        toast.error(data.error || 'Failed to enroll')
      }
    } catch (err) {
      toast.error('An error occurred')
    }
  }

  // Get all enrollments for wall view
  const allEnrollments = challenges.flatMap((c) => c.enrollments || [])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-9 w-64 rounded bg-slate-800" />
          <div className="flex gap-2 border-b border-slate-700 pb-2">
            <div className="h-10 w-40 rounded bg-slate-800" />
            <div className="h-10 w-36 rounded bg-slate-800" />
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
        <h1 className="text-3xl font-bold text-white">Offers & Challenges</h1>
        <p className="mt-2 text-slate-400">Take on challenges and unlock rewards</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('challenges')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'challenges'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Available Challenges
        </button>
        <button
          onClick={() => setActiveTab('wall')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'wall'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Wall of Challengers
        </button>
      </div>

      {activeTab === 'challenges' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.length === 0 ? (
            <div className="col-span-full rounded-xl border border-slate-700 bg-slate-800/50">
              <EmptyState
                icon={Trophy}
                title="No challenges yet"
                description="New challenges will appear here. Check back later or ask your admin."
                actionLabel="Go to Dashboard"
                actionHref="/dashboard"
                variant="dark"
              />
            </div>
          ) : challenges.map((challenge) => {
            const requirements = JSON.parse(challenge.requirementsJson || '{}')
            const isEnrolled = myEnrollments.some((e) => e.challengeId === challenge.id)

            return (
              <div
                key={challenge.id}
                className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition"
              >
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-amber-500/20 rounded-lg">
                    <Trophy className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold text-white">{challenge.title}</h3>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-sm font-medium text-slate-400 mb-2">Reward:</p>
                  <p className="text-lg font-semibold text-emerald-400">{challenge.reward}</p>
                </div>
                <div className="mb-4">
                  <p className="text-sm font-medium text-slate-400 mb-2">Requirements:</p>
                  <ul className="text-sm text-slate-300 space-y-1">
                    {Object.entries(requirements).map(([key, value]) => (
                      <li key={key}>
                        • {key}: {String(value)}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mb-4 text-xs text-slate-500">
                  <p>Ends: {new Date(challenge.endDate).toLocaleDateString()}</p>
                </div>
                {isEnrolled ? (
                  <div className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-center font-medium">
                    You're enrolled!
                  </div>
                ) : (
                  <button
                    onClick={() => handleTakeChallenge(challenge.id)}
                    className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                  >
                    Take This Challenge
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'wall' && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <h2 className="text-xl font-semibold text-white">Wall of Challengers</h2>
            <p className="text-sm text-slate-400 mt-1">See who's taking on challenges</p>
          </div>
          {allEnrollments.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No challengers yet"
              description="Be the first to take on a challenge and show up here!"
              actionLabel="View challenges"
              onAction={() => setActiveTab('challenges')}
              variant="dark"
            />
          ) : (
            <div className="divide-y divide-slate-700">
              {allEnrollments.map((enrollment) => {
                const progress = JSON.parse(enrollment.progressJson || '{}')
                const challenge = challenges.find((c) =>
                  c.enrollments?.some((e) => e.id === enrollment.id)
                )

                return (
                  <div key={enrollment.id} className="p-6 hover:bg-slate-700/30">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <Users className="w-5 h-5 text-slate-400 mr-2" />
                          <span className="font-semibold text-white">{enrollment.user.name}</span>
                          <span className="ml-2 px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded">
                            {enrollment.user.role}
                          </span>
                          {enrollment.user.city && (
                            <span className="ml-2 text-sm text-slate-500">{enrollment.user.city}</span>
                          )}
                        </div>
                        {challenge && (
                          <p className="text-slate-300 mb-2">
                            Challenge: <strong className="text-white">{challenge.title}</strong>
                          </p>
                        )}
                        <div className="text-sm text-slate-400">
                          <p>Started: {new Date(enrollment.enrolledAt).toLocaleDateString()}</p>
                          <p>Status: {enrollment.status}</p>
                        </div>
                      </div>
                      <div className="ml-4">
                        {enrollment.status === 'COMPLETED' ? (
                          <div className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg font-semibold">
                            Completed! 🎉
                          </div>
                        ) : (
                          <div className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg">
                            In Progress
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
