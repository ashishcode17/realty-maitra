export function buildUserPath(parentPath: string[] | null): string[] {
  return parentPath || [];
}

export function canViewUser(currentUser: any, targetUser: any): boolean {
  // Admin can view all
  if (currentUser.role === 'SUPER_ADMIN') {
    return true;
  }
  
  // Can view self
  if (currentUser.id === targetUser.id) {
    return true;
  }
  
  // Can view if target is in current user's subtree
  return targetUser.path && targetUser.path.includes(currentUser.id);
}

export function getSubtreeFilter(userId: string) {
  return {
    path: {
      array_contains: [userId]
    }
  };
}

export function calculateTreeStats(users: any[], rootUserId: string) {
  const subtree = users.filter(u => 
    (u.path && Array.isArray(u.path) && u.path.includes(rootUserId)) ||
    u.sponsorId === rootUserId
  );
  const direct = users.filter(u => u.sponsorId === rootUserId);
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const activeThisMonth = subtree.filter(u => {
    const lastActive = u.lastActive || u.updatedAt || u.createdAt;
    return lastActive && new Date(lastActive) > thirtyDaysAgo;
  });
  
  return {
    totalSubtree: subtree.length,
    directDownlines: direct.length,
    activeThisMonth: activeThisMonth.length,
    byRole: subtree.reduce((acc: any, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {}),
  };
}
