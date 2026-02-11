'use client'

import { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  /** Use for dark main background (e.g. slate-950) */
  variant?: 'light' | 'dark'
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  variant = 'light',
}: EmptyStateProps) {
  const isDark = variant === 'dark'
  const textMuted = isDark ? 'text-slate-400' : 'text-gray-500'
  const textTitle = isDark ? 'text-white' : 'text-gray-900'

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div
        className={`rounded-full p-4 mb-4 ${
          isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500'
        }`}
      >
        <Icon className="h-10 w-10" />
      </div>
      <h3 className={`text-lg font-semibold ${textTitle} mb-1`}>{title}</h3>
      {description && <p className={`text-sm ${textMuted} max-w-sm mb-6`}>{description}</p>}
      {(actionLabel && (actionHref || onAction)) && (
        actionHref ? (
          <Button asChild className={isDark ? 'bg-emerald-600 hover:bg-emerald-700' : ''}>
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        ) : (
          <Button onClick={onAction} className={isDark ? 'bg-emerald-600 hover:bg-emerald-700' : ''}>
            {actionLabel}
          </Button>
        )
      )}
    </div>
  )
}
