export const ROLES = {
  SUPER_ADMIN: { rank: 100, label: 'Super Admin' },
  DIRECTOR: { rank: 6, label: 'Director' },
  VP: { rank: 5, label: 'VP' },
  AVP: { rank: 4, label: 'AVP' },
  SSM: { rank: 3, label: 'SSM' },
  SM: { rank: 2, label: 'SM' },
  BDM: { rank: 1, label: 'BDM' },
};

export const DEFAULT_SLAB_CONFIG = {
  DIRECTOR: 100,
  VP: 90,
  AVP: 80,
  SSM: 70,
  SM: 60,
  BDM: 40,
  uplineBonus: 5,
};

export function getRoleRank(role: string): number {
  return ROLES[role as keyof typeof ROLES]?.rank || 0;
}

export function getRoleLabel(role: string): string {
  return ROLES[role as keyof typeof ROLES]?.label || role;
}

export function getAllRoles(): string[] {
  return Object.keys(ROLES).filter(r => r !== 'SUPER_ADMIN');
}
