'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Copy } from 'lucide-react'
import { toast } from 'sonner'

/**
 * Reusable masked invite code display. Use everywhere invite code is shown.
 * - Masked by default (••••• or same length as code).
 * - Eye toggle to show/hide. Copy always copies the real code (does not leak in DOM when masked).
 * - Do not pass code to data-* or title when masked to avoid leaks.
 */
interface InviteCodeFieldProps {
  /** The actual invite code. Never rendered in DOM when masked; only used for copy. */
  code: string | null | undefined
  /** Optional label above the field */
  label?: string
  /** Optional helper text below */
  helperText?: string
  /** CSS class for the container */
  className?: string
  /** Size of code display */
  size?: 'sm' | 'md' | 'lg'
}

const MASK_CHAR = '•'

function maskCode(code: string): string {
  if (!code) return '—'
  return code.split('').map(() => MASK_CHAR).join('')
}

export function InviteCodeField({ code, label, helperText, className = '', size = 'md' }: InviteCodeFieldProps) {
  const [revealed, setRevealed] = useState(false)
  const displayValue = !code ? '—' : (revealed ? code : maskCode(code))
  const canCopy = !!code

  const handleCopy = () => {
    if (!code) return
    navigator.clipboard.writeText(code)
    toast.success('Invite code copied')
  }

  const codeClass = size === 'lg' ? 'text-lg' : size === 'sm' ? 'text-sm' : 'text-base'

  return (
    <div className={className}>
      {label && (
        <p className="text-slate-400 text-sm mb-2">{label}</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <code
          className={`px-4 py-2 bg-slate-900 rounded font-mono text-emerald-400 min-w-[8rem] ${codeClass}`}
          aria-label={revealed && code ? undefined : 'Invite code hidden'}
        >
          {displayValue}
        </code>
        {canCopy && (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-slate-600 text-slate-300"
              onClick={() => setRevealed((v) => !v)}
              title={revealed ? 'Hide code' : 'Show code'}
              aria-label={revealed ? 'Hide invite code' : 'Show invite code'}
            >
              {revealed ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
              {revealed ? 'Hide' : 'Show'}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCopy}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Copy className="h-4 w-4 mr-1" /> Copy
            </Button>
          </>
        )}
      </div>
      {helperText && (
        <p className="text-slate-500 text-xs mt-2">{helperText}</p>
      )}
    </div>
  )
}
