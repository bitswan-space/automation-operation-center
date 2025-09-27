import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactFlowProvider } from '@xyflow/react';
import { Toaster } from '@/components/ui/sonner';

import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import AuthCallbackPage from '@/pages/AuthCallbackPage';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardPage from '@/pages/DashboardPage';
import AutomationServersPage from '@/pages/AutomationServersPage';
import AutomationServerDetailPage from '@/pages/AutomationServerDetailPage';
import WorkspaceDetailPage from '@/pages/WorkspaceDetailPage';
import AutomationsPage from '@/pages/AutomationsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactFlowProvider>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={<DashboardPage />} />
                <Route path="automation-servers" element={<AutomationServersPage />} />
                <Route path="automation-servers/:id" element={<AutomationServerDetailPage />} />
                <Route path="automation-servers/:id/workspaces/:workspaceId" element={<WorkspaceDetailPage />} />
                <Route path="automations" element={<AutomationsPage />} />
                <Route path="*" element={<DashboardPage />} />
              </Route>
              
              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
          
          <Toaster />
          <ReactQueryDevtools initialIsOpen={false} />
        </AuthProvider>
      </ReactFlowProvider>
    </QueryClientProvider>
  );
}

export default App;