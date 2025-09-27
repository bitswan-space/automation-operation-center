"use client";

import { useAuth } from "@/context/AuthContext";

/**
 * Client-side handler for token expiration errors
 * Clears tokens and redirects to login page
 */
export function useTokenErrorHandler() {
  const { logout } = useAuth();

  const handleTokenExpiration = async () => {
    try {
      // Clear auth tokens and redirect
      logout();
    } catch (error) {
      console.error("Error handling token expiration:", error);
      // Fallback redirect if something goes wrong
      window.location.href = "/login";
    }
  };

  /**
   * Checks if an error is a token expiration error (403 with specific message)
   */
  const isTokenExpirationError = (error: any): boolean => {
    return (
      error?.response?.status === 403 &&
      (error?.response?.data?.detail === "expired or invalid token" ||
       error?.message?.includes("expired or invalid token"))
    );
  };

  /**
   * Wrapper for client-side API calls that automatically handles token expiration
   */
  const withTokenErrorHandling = async <T>(
    apiCall: () => Promise<T>
  ): Promise<T> => {
    try {
      return await apiCall();
    } catch (error) {
      if (isTokenExpirationError(error)) {
        console.log("Token expired, redirecting to login...");
        await handleTokenExpiration();
      }
      throw error; // Re-throw if it's not a token expiration error
    }
  };

  return {
    handleTokenExpiration,
    isTokenExpirationError,
    withTokenErrorHandling,
  };
}
