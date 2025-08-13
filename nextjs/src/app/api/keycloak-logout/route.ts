import { type NextRequest } from "next/server";
import { env } from "@/env.mjs";
import { auth, signOut } from "@/server/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (session) {
      const KEYCLOAK_END_SESSION_URL = env.KEYCLOAK_END_SESSION_URL;
      const KEYCLOAK_POST_LOGOUT_REDIRECT_URI =
        env.KEYCLOAK_POST_LOGOUT_REDIRECT_URI;

      const idToken = session.id_token;
      const url = `${KEYCLOAK_END_SESSION_URL}?id_token_hint=${idToken}&post_logout_redirect_uri=${KEYCLOAK_POST_LOGOUT_REDIRECT_URI}`;
      
      // Invalidate Keycloak session
      await fetch(url, { method: "GET" });
    }

    // Clear NextAuth session
    await signOut();
    
    // Return success response for client-side fetch
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    console.error("Logout error:", error);
    
    return new Response(JSON.stringify({ success: false, error: "Logout failed" }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
