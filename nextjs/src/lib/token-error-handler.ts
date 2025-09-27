import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signOut } from "@/server/auth";

/**
 * Handles token expiration errors by clearing all cookies and redirecting to login
 * This should be called when API calls return 403 with "expired or invalid token"
 */
export async function handleTokenExpiration() {
  try {
    // Clear all cookies
    const cookieStore = await cookies();
    
    // Get all cookies and clear them
    const allCookies = cookieStore.getAll();
    for (const cookie of allCookies) {
      cookieStore.delete(cookie.name);
    }
    
    // Sign out from NextAuth (this will trigger the signOut event)
    await signOut();
    
    // Redirect to login page
    redirect("/api/auth/signin");
  } catch (error) {
    console.error("Error handling token expiration:", error);
    // Fallback redirect if something goes wrong
    redirect("/api/auth/signin");
  }
}

/**
 * Checks if an error is a token expiration error (403 with specific message)
 */
export function isTokenExpirationError(error: any): boolean {
  return (
    error?.response?.status === 403 &&
    (error?.response?.data?.detail === "expired or invalid token" ||
     error?.message?.includes("expired or invalid token"))
  );
}

/**
 * Wrapper for API calls that automatically handles token expiration
 */
export async function withTokenErrorHandling<T>(
  apiCall: () => Promise<T>
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    if (isTokenExpirationError(error)) {
      console.log("Token expired, redirecting to login...");
      await handleTokenExpiration();
    }
    throw error; // Re-throw if it's not a token expiration error
  }
}
