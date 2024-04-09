import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

import { env } from "@/env.mjs";
import { type DefaultJWT, type JWT } from "next-auth/jwt";
import jwt_decode from "jwt-decode";
import { handleError } from "@/utils/errors";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    access_token: string;
    expired: boolean;
    id_token: string;
    roles?: string[];
    user: DefaultSession["user"] & {
      id: string;
      // ...other properties
      // role: UserRole;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    decoded?: {
      realm_access?: {
        roles?: string[];
      };
    };
    access_token: string;
    id_token: string;
    expires_in: number;
    expires_at: number;
    refresh_token: string;
  }
}

// this will refresh an expired access token, when needed
async function refreshAccessToken(token: JWT): Promise<JWT> {
  const resp = await fetch(`${env.KEYCLOAK_REFRESH_URL}`, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.KEYCLOAK_CLIENT_ID,
      client_secret: env.KEYCLOAK_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: token.refresh_token ?? "",
    }),
    method: "POST",
  });

  const refreshToken = (await resp.json()) as JWT;

  if (!resp.ok) throw refreshToken;

  return {
    ...token,
    access_token: refreshToken.access_token,
    decoded: jwt_decode(refreshToken.access_token ?? ""),
    id_token: refreshToken.id_token,
    expires_at: Math.floor(Date.now() / 1000) + (refreshToken.expires_in ?? 0),
    refresh_token: refreshToken.refresh_token,
  };
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  callbacks: {
    jwt: async ({ token, account }) => {
      const nowTimeStamp = Math.floor(Date.now() / 1000);
      if (account) {
        console.log("Account is present. Will decode and return token.");
        token.decoded = jwt_decode(account.access_token ?? "");
        token.access_token = account.access_token ?? "";
        token.id_token = account.id_token ?? "";
        token.expires_at = account.expires_at ?? 0;
        token.refresh_token = account.refresh_token ?? "";
        token.expired = false;
        return token;
      } else if (nowTimeStamp < (token.expires_at ?? 0)) {
        // token has not expired yet, return it
        return token;
      } else {
        // token is expired, try to refresh it
        console.log("Token has expired. Will refresh...");
        try {
          const refreshedToken: JWT = await refreshAccessToken(token);
          console.log("Token is refreshed.");
          return refreshedToken;
        } catch (error) {
          handleError(error as Error, "Failed to refresh access token");

          return {
            ...token,
            expired: true,
            error: "RefreshAccessTokenError",
          };
        }
      }
    },

    session: ({ session, token }) => {
      console.log("Session callback", session, token);
      return {
        ...session,
        expired: token.expired,
        access_token: token.access_token,
        id_token: token.id_token,
        roles: token.decoded?.realm_access?.roles ?? [],
        user: {
          ...session.user,
          id: token.sub,
        },
      };
    },
  },
  providers: [
    KeycloakProvider({
      clientId: env.KEYCLOAK_CLIENT_ID,
      clientSecret: env.KEYCLOAK_CLIENT_SECRET,
      issuer: env.KEYCLOAK_ISSUER,
    }),
  ],
  // pages: {
  //   signIn: "/auth/signin",
  // },
};

export type ServerAuthSessionCtx = {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: ServerAuthSessionCtx) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
