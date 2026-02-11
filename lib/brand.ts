/**
 * Single source of truth for app branding.
 * Use these constants everywhere instead of hardcoding the app name.
 */
export const brand = {
  appName: 'Realty Maitra',
  shortName: 'RM',
  tagline: 'Build Teams · Build Trust · Create Income',
  supportEmail: 'support@realtymaitra.com',
  /** Default "from" for transactional emails (override via SMTP_FROM env) */
  emailFrom: 'noreply@realtymaitra.com',
} as const

export type Brand = typeof brand
