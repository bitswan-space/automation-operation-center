// Simple permissions utility
export const isUserAdmin = (user: any): boolean => {
  // Check if user is in any admin group (ends with '/admin')
  return user?.groups?.some((group: any) => 
    group.name?.toLowerCase().endsWith('/admin') || 
    group.name?.toLowerCase() === 'admin'
  ) || false;
};

// Organization-specific admin check using API
export const isUserAdminInCurrentOrg = async (): Promise<boolean> => {
  try {
    const { authenticatedBitswanBackendInstance } = await import('@/lib/api-client');
    const apiClient = await authenticatedBitswanBackendInstance();
    const response = await apiClient.get('/users/me/admin-status/');
    return response.data.is_admin;
  } catch (error) {
    console.error('Failed to check admin status:', error);
    return false;
  }
};

export function canSeeSettingsPage(user: any) {
  // This function is deprecated - use useAdminStatus hook instead
  console.warn('canSeeSettingsPage is deprecated. Use useAdminStatus hook for organization-specific admin checks.');
  return isUserAdmin(user);
}

export function canMutateGroups(user: any) {
  // This function is deprecated - use useAdminStatus hook instead
  console.warn('canMutateGroups is deprecated. Use useAdminStatus hook for organization-specific admin checks.');
  return isUserAdmin(user);
}

export function canMutateGitops(user: any) {
  // This function is deprecated - use useAdminStatus hook instead
  console.warn('canMutateGitops is deprecated. Use useAdminStatus hook for organization-specific admin checks.');
  return isUserAdmin(user);
}

export function canMutateUsers(user: any) {
  // This function is deprecated - use useAdminStatus hook instead
  console.warn('canMutateUsers is deprecated. Use useAdminStatus hook for organization-specific admin checks.');
  return isUserAdmin(user);
}

export function canMutateSidebarItems(user: any) {
  // This function is deprecated - use useAdminStatus hook instead
  console.warn('canMutateSidebarItems is deprecated. Use useAdminStatus hook for organization-specific admin checks.');
  return isUserAdmin(user);
}
