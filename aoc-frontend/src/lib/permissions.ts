// Simple permissions utility
export const isUserAdmin = (user: any): boolean => {
  // Check if user is in any admin group (ends with '/admin')
  return user?.groups?.some((group: any) => 
    group.name?.toLowerCase().endsWith('/admin') || 
    group.name?.toLowerCase() === 'admin'
  ) || false;
};

export function canSeeSettingsPage(user: any) {
  return isUserAdmin(user);
}

export function canMutateGroups(user: any) {
  return isUserAdmin(user);
}

export function canMutateGitops(user: any) {
  return isUserAdmin(user);
}

export function canMutateUsers(user: any) {
  return isUserAdmin(user);
}

export function canMutateSidebarItems(user: any) {
  return isUserAdmin(user);
}
