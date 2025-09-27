/**
 * Unified logout handler that properly coordinates authentication logout
 * This ensures both client and server sessions are properly cleared
 */
export const handleLogout = async () => {
  try {
    // Call the server-side logout endpoint to invalidate Keycloak session
    await fetch("/api/frontend/auth/logout/", {
      method: "GET",
      credentials: "include"
    });
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    // Clear local storage and redirect
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('id_token');
    window.location.href = '/login';
  }
};
