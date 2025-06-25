import { type NextRequest } from "next/server";
import { env } from "@/env.mjs";
import { auth, signOut } from "@/server/auth";

export async function GET(req: NextRequest) {
  const session = await auth();

  if (session) {
    const KEYCLOAK_END_SESSION_URL = env.KEYCLOAK_END_SESSION_URL;
    const KEYCLOAK_POST_LOGOUT_REDIRECT_URI =
      env.KEYCLOAK_POST_LOGOUT_REDIRECT_URI;

    const idToken = session.id_token;
    const url = `${KEYCLOAK_END_SESSION_URL}?id_token_hint=${idToken}&post_logout_redirect_uri=${KEYCLOAK_POST_LOGOUT_REDIRECT_URI}`;
    await fetch(url, { method: "GET" });
  }

  await signOut();
}
