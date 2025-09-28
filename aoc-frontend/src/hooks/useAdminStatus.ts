import { useState, useEffect } from 'react';
import { isUserAdminInCurrentOrg } from '@/lib/permissions';

export function useAdminStatus() {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setIsLoading(true);
        const adminStatus = await isUserAdminInCurrentOrg();
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error('Failed to check admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  return { isAdmin, isLoading };
}
