import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const LoginPage: React.FC = () => {
  const { login, isAuthenticated, isLoading } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Automatically redirect to Keycloak when component mounts
  useEffect(() => {
    if (!isLoading) {
      login().catch((error) => {
        console.error('Failed to initiate login:', error);
      });
    }
  }, [isLoading, login]);

  // Show loading state while redirecting
  return (
    <div 
      className="flex min-h-screen min-w-screen items-center justify-center bg-gray-50"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 50
      }}
    >
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to Keycloak...</p>
      </div>
    </div>
  );
};

export default LoginPage;
