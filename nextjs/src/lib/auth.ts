import { signOut } from "next-auth/react";

/**
 * Unified logout handler that properly coordinates NextAuth and Keycloak logout
 * This ensures both client and server sessions are properly cleared
 */
export const handleLogout = async () => {
  try {
    // Clear NextAuth session and redirect - this will trigger the signOut event
    // which properly logs out from Keycloak with the correct redirect URI
    await signOut({ 
      callbackUrl: "/api/auth/signin",
      redirect: true 
    });
  } catch (error) {
    console.error("Logout error:", error);
  }
}; 
