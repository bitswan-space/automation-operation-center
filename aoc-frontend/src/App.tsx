import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import Providers from "@/context/Providers";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminProtectedRoute } from "@/components/auth/AdminProtectedRoute";
import { useHttpsRedirect } from "@/hooks/useHttpsRedirect";
import LoginPage from "@/pages/LoginPage";
import AuthCallbackPage from "@/pages/AuthCallbackPage";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPage from "@/pages/DashboardPage";
import AutomationServersPage from "@/pages/AutomationServersPage";
import AutomationServerDetailPage from "@/pages/AutomationServerDetailPage";
import WorkspaceDetailPage from "@/pages/WorkspaceDetailPage";
import AutomationDetailPage from "@/pages/AutomationDetailPage";
import AutomationsPage from "@/pages/AutomationsPage";
import SettingsPage from "@/pages/SettingsPage";
import WorkspacesPage from "./pages/WorkspacesPage";
import ProcessesPage from "./pages/ProcessesPage";
import ProcessDetailPage from "./pages/ProcessDetailPage";


function App() {
    // Redirect to HTTPS if currently on HTTP (production only)
    useHttpsRedirect();

    return (
        <Providers>
            <Router>
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route
                        path="/auth/callback"
                        element={<AuthCallbackPage />}
                    />

                    {/* Protected routes */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <DashboardLayout path="/dashboard" />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<DashboardPage />} />
                        <Route path="*" element={<DashboardPage />} />
                    </Route>

                    {/* Automation server routes */}
                    <Route
                        path="/automation-servers"
                        element={
                            <AdminProtectedRoute>
                                <DashboardLayout path="/automation-servers" />
                            </AdminProtectedRoute>
                        }
                    >
                        <Route index element={<AutomationServersPage />} />
                        <Route
                            path=":id"
                            element={<AutomationServerDetailPage />}
                        />
                        <Route
                            path=":id/workspaces/:workspaceId/automations/:pipelineId"
                            element={<AutomationDetailPage />}
                        />
                    </Route>

                    {/* Workspaces route */}
                    <Route
                        path="/workspaces"
                        element={
                            <ProtectedRoute>
                                <DashboardLayout path="/workspaces" />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<WorkspacesPage />} />
                        <Route
                            path=":id"
                            element={<WorkspaceDetailPage />}
                        />
                        <Route
                            path=":id/processes/:processId"
                            element={<ProcessDetailPage />}
                        />
                    </Route>

                    {/* Processes route */}
                    <Route
                        path="/processes"
                        element={
                            <ProtectedRoute>
                                <DashboardLayout path="/processes" />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<ProcessesPage />} />
                    </Route>

                    {/* Automations route */}
                    <Route
                        path="/automations"
                        element={
                            <ProtectedRoute>
                                <DashboardLayout path="/automations" />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<AutomationsPage />} />
                    </Route>

                    {/* Settings route */}
                    <Route
                        path="/settings"
                        element={
                            <AdminProtectedRoute>
                                <DashboardLayout path="/settings" />
                            </AdminProtectedRoute>
                        }
                    >
                        <Route index element={<SettingsPage />} />
                    </Route>

                    {/* Default redirect */}
                    <Route
                        path="/"
                        element={<Navigate to="/dashboard" replace />}
                    />
                    <Route
                        path="*"
                        element={<Navigate to="/dashboard" replace />}
                    />
                </Routes>
            </Router>

            <ReactQueryDevtools initialIsOpen={false} />
        </Providers>
    );
}

export default App;
