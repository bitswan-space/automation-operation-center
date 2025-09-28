import { useAdmin } from '@/context/AdminContext';

export function useAdminStatus() {
  const { isAdmin, isLoading, refreshAdminStatus } = useAdmin();
  
  return { 
    isAdmin, 
    isLoading,
    refreshAdminStatus 
  };
}
