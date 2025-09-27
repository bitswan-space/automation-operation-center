"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

/**
 * Client-side handler for token expiration errors
 * Clears cookies and redirects to login page
 */
export function useTokenErrorHandler() {
  const router = useRouter();

  const handleTokenExpiration = async () => {
    try {
      // Clear NextAuth session and redirect
      await signOut({ 
        callbackUrl: "/api/auth/signin",
        redirect: true 
      });
    } catch (error) {
      console.error("Error handling token expiration:", error);
      // Fallback redirect if something goes wrong
      router.push("/api/auth/signin");
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
