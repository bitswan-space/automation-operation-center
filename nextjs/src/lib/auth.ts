import { signOut } from "next-auth/react";

/**
 * Unified logout handler that properly coordinates NextAuth and Keycloak logout
 * This ensures both client and server sessions are properly cleared
 */
export const handleLogout = async () => {
  try {
    // Call the server-side logout endpoint to invalidate Keycloak session
    await fetch("/api/keycloak-logout", {
      method: "GET",
      credentials: "include"
    });
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    // Clear NextAuth session and redirect
    await signOut({ 
      callbackUrl: "/api/auth/signin",
      redirect: true 
    });
  }
}; 
