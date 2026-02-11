/**
 * Default settings JSON for new users. Used when creating UserSettings.
 */
export const DEFAULT_NOTIFICATION_PREFS = {
  productUpdates: { inApp: true, email: true },
  trainingReminders: { inApp: true, email: true },
  challengeUpdates: { inApp: true, email: true },
  earningsUpdates: { inApp: true, email: true },
}

export const DEFAULT_PRIVACY_PREFS = {
  phoneVisibility: 'ADMIN_ONLY' as const, // ADMIN_ONLY | UPLINE_ONLY | NOBODY
  emailVisibility: 'ADMIN_ONLY' as const,
  cityVisibility: 'SUBTREE' as const, // SUBTREE | DIRECT_ONLY | NOBODY
}

export const DEFAULT_APP_PREFS = {
  theme: 'system' as const, // light | dark | system
  language: 'en' as const, // en | hinglish
  compactMode: false,
}

export type NotificationPrefs = typeof DEFAULT_NOTIFICATION_PREFS
export type PrivacyPrefs = typeof DEFAULT_PRIVACY_PREFS
export type AppPrefs = typeof DEFAULT_APP_PREFS
