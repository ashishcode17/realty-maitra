/**
 * Design tokens for consistent contrast and theming.
 * Use these class names instead of ad-hoc colors so text stays visible on both light and dark surfaces.
 */

/** Text on dark surfaces (slate-800, slate-900, slate-950) */
export const textOnDark = {
  primary: 'text-white',
  secondary: 'text-slate-300',
  muted: 'text-slate-400',
  placeholder: 'text-slate-500',
} as const

/** Text on light surfaces (white, slate-50, slate-100) */
export const textOnLight = {
  primary: 'text-slate-900',
  secondary: 'text-slate-700',
  muted: 'text-slate-600',
  placeholder: 'text-slate-500',
} as const

/** Minimum contrast: avoid text-slate-500 on dark bg; use text-slate-400 at least. */
export const minContrastDark = 'text-slate-400'
