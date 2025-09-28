import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { isUserAdminInCurrentOrg } from '@/lib/permissions';
import { useAuth } from './AuthContext';

interface AdminContextType {
  isAdmin: boolean;
  isLoading: boolean;
  refreshAdminStatus: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { isAuthenticated, user } = useAuth();

  const checkAdminStatus = async () => {
    if (!isAuthenticated || !user) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

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

  const refreshAdminStatus = async () => {
    await checkAdminStatus();
  };

  // Check admin status when user authentication changes
  useEffect(() => {
    checkAdminStatus();
  }, [isAuthenticated, user?.id]);

  const value = {
    isAdmin,
    isLoading,
    refreshAdminStatus,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
