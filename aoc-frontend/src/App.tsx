import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactFlowProvider } from '@xyflow/react';
import { Toaster } from '@/components/ui/sonner';

import { AuthProvider } from '@/context/AuthContext';
import { AdminProvider } from '@/context/AdminContext';
import { MQTTTokensProvider } from '@/context/MQTTTokensProvider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminProtectedRoute } from '@/components/auth/AdminProtectedRoute';
import { useHttpsRedirect } from '@/hooks/useHttpsRedirect';
import LoginPage from '@/pages/LoginPage';
import AuthCallbackPage from '@/pages/AuthCallbackPage';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardPage from '@/pages/DashboardPage';
import AutomationServersPage from '@/pages/AutomationServersPage';
import AutomationServerDetailPage from '@/pages/AutomationServerDetailPage';
import WorkspaceDetailPage from '@/pages/WorkspaceDetailPage';
import AutomationDetailPage from '@/pages/AutomationDetailPage';
import AutomationsPage from '@/pages/AutomationsPage';
import SettingsPage from '@/pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  // Redirect to HTTPS if currently on HTTP (production only)
  useHttpsRedirect();

  return (
    <QueryClientProvider client={queryClient}>
      <ReactFlowProvider>
        <AuthProvider>
          <AdminProvider>
            <MQTTTokensProvider>
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
                <Route path="*" element={<DashboardPage />} />
              </Route>
              
              {/* Automation server routes */}
              <Route path="/automation-servers" element={
                <AdminProtectedRoute>
                  <DashboardLayout />
                </AdminProtectedRoute>
              }>
                <Route index element={<AutomationServersPage />} />
                <Route path=":id" element={<AutomationServerDetailPage />} />
                <Route path=":id/workspaces/:workspaceId" element={<WorkspaceDetailPage />} />
                <Route path=":id/workspaces/:workspaceId/automations/:pipelineId" element={<AutomationDetailPage />} />
              </Route>
              
              {/* Automations route */}
              <Route path="/automations" element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={<AutomationsPage />} />
              </Route>
              
              {/* Settings route */}
              <Route path="/settings" element={
                <AdminProtectedRoute>
                  <DashboardLayout />
                </AdminProtectedRoute>
              }>
                <Route index element={<SettingsPage />} />
              </Route>
              
              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            </Router>
            
            <Toaster />
            <ReactQueryDevtools initialIsOpen={false} />
            </MQTTTokensProvider>
          </AdminProvider>
        </AuthProvider>
      </ReactFlowProvider>
    </QueryClientProvider>
  );
}

export default App;