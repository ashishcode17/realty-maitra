/**
 * Performance rank (R0..R5). Stable enum keys; labels from config for display.
 * Chosen set: premium/corporate vibe. See OFFICIAL_APP_RULEBOOK.
 */

export type PerformanceRankKey = 'R0' | 'R1' | 'R2' | 'R3' | 'R4' | 'R5'

export const PERFORMANCE_RANK_ORDER: PerformanceRankKey[] = ['R0', 'R1', 'R2', 'R3', 'R4', 'R5']

/** Chosen set: professional labels (Director > VP > AVP > SSM > SM > Entry) */
export const PERFORMANCE_RANK_LABELS: Record<PerformanceRankKey, string> = {
  R0: 'Director',
  R1: 'Vice President',
  R2: 'Associate Vice President',
  R3: 'Senior Manager',
  R4: 'Manager',
  R5: 'Associate',
}

export function getPerformanceRankLabel(key: PerformanceRankKey | string): string {
  return PERFORMANCE_RANK_LABELS[key as PerformanceRankKey] ?? key
}
