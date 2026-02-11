'use client'

import Link from 'next/link'
import { brand } from '@/lib/brand'

type BrandLogoProps = {
  /** Show wordmark (full "Realty Maitra") next to monogram */
  showWordmark?: boolean
  /** Size: 'sm' | 'md' | 'lg' */
  size?: 'sm' | 'md' | 'lg'
  /** Light text (for dark backgrounds) vs dark (for light backgrounds) */
  variant?: 'light' | 'dark'
  /** Wrap in link to home/dashboard */
  href?: string | null
  className?: string
}

const sizes = {
  sm: { monogram: 28, text: 'text-lg' },
  md: { monogram: 36, text: 'text-xl' },
  lg: { monogram: 44, text: 'text-2xl' },
}

export function BrandLogo({
  showWordmark = true,
  size = 'md',
  variant = 'light',
  href = '/',
  className = '',
}: BrandLogoProps) {
  const { monogram: monogramSize, text: textSize } = sizes[size]
  const fill = variant === 'light' ? 'currentColor' : '#0f172a'
  const textClass = variant === 'light' ? 'text-white' : 'text-slate-900'

  const content = (
    <>
      {/* RM monogram */}
      <svg
        width={monogramSize}
        height={monogramSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden
      >
        <rect width="40" height="40" rx="8" fill="currentColor" className="text-emerald-600" />
        <text x="20" y="26" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="system-ui, sans-serif">RM</text>
      </svg>
      {showWordmark && (
        <span className={`font-bold ${textSize} ${textClass} whitespace-nowrap`}>
          {brand.appName}
        </span>
      )}
    </>
  )

  const wrapperClass = `inline-flex items-center gap-2 ${className}`

  if (href) {
    return (
      <Link href={href} className={wrapperClass} aria-label={`${brand.appName} home`}>
        {content}
      </Link>
    )
  }
  return <div className={wrapperClass}>{content}</div>
}
