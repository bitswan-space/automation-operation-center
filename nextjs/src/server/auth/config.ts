import { type DefaultJWT, type JWT } from "next-auth/jwt";
import KeycloakProvider, {
  type KeycloakProfile,
} from "next-auth/providers/keycloak";
import { type DefaultSession, type NextAuthConfig } from "next-auth";

import { type OAuthConfig } from "next-auth/providers";
import { env } from "@/env.mjs";
import { keyCloakSessionLogOut } from "@/utils/keycloak";
import { signOut } from ".";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    id_token: string;
    access_token: string;
    user: {
      id: string;
      group_membership: string[];
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }
  interface Profile {
    group_membership?: string[];
    // Add other custom properties as needed
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
    refresh_expires_in: number;
    refresh_expires_at: number;
    provider?: string;
  }
}

type RefreshTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  "not-before-policy": number;
  session_state: string;
  scope: string;
};

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
/**
 * @param  {JWT} token
 */
const refreshAccessToken = async (token: JWT) => {
  try {
    const details = {
      client_id: env.KEYCLOAK_CLIENT_ID,
      client_secret: env.KEYCLOAK_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: token.refresh_token,
    };

    const formBody: string[] = [];
    Object.entries(details).forEach(([key, value]: [string, string]) => {
      const encodedKey = encodeURIComponent(key);
      const encodedValue = encodeURIComponent(value);
      formBody.push(encodedKey + "=" + encodedValue);
    });

    const formData = formBody.join("&");
    const url = env.KEYCLOAK_REFRESH_URL;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: formData,
    });

    const refreshedTokens = (await response.json()) as RefreshTokenResponse;
    if (!response.ok) throw refreshedTokens;
    return {
      ...token,
      access_token: refreshedTokens.access_token,
      expires_at: Date.now() + (refreshedTokens.expires_in - 15) * 1000,
      refresh_token: refreshedTokens.refresh_token ?? token.refreshToken,
      refresh_expires_at:
        Date.now() + (refreshedTokens.refresh_expires_in - 15) * 1000,
    };
  } catch (error) {
    console.error(error, "Error refreshing access token");

    keyCloakSessionLogOut()
      .then((_) => {
        signOut()
          .then((res) => console.info(res))
          .catch((error: Error) => {
            console.error(error, "Failed to sign out");
          });
      })
      .catch((error: Error) => {
        console.error(error, "Failed to end Keycloak session");
      });

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
};

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      access_token: token.access_token,
      user: {
        ...session.user,
        group_membership: token.group_membership ?? [],
        id: token.sub,
      },
    }),
    jwt: ({ token, user, account, profile }) => {
      // Initial sign in
      if (account && user) {
        // Add access_token, refresh_token and expirations to the token right after signin
        token.id_token = account.id_token ?? "";
        token.access_token = account.access_token ?? "";
        token.refresh_token = account.refresh_token ?? "";
        token.expires_at = account.expires_at ?? 0;
        token.user = user;
        token.provider = account.provider;
        token.group_membership = profile?.group_membership ?? [];
        return token;
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < token.expires_at) return token;

      // Access token has expired, try to update it
      return refreshAccessToken(token);
    },
  },
  events: {
    async signOut(message) {
      if (!("token" in message)) return;
      const { token } = message;

      if (token?.provider === "keycloak") {
        const issuerUrl = (
          authConfig.providers.find(
            (p) => p.id === "keycloak",
          ) as OAuthConfig<KeycloakProfile>
        ).options!.issuer!;
        const logOutUrl = new URL(
          `${issuerUrl}/protocol/openid-connect/logout`,
        );
        logOutUrl.searchParams.set("id_token_hint", token?.id_token);
        await fetch(logOutUrl);
      }
    },
  },

  providers: [
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
    KeycloakProvider({
      clientId: env.KEYCLOAK_CLIENT_ID,
      clientSecret: env.KEYCLOAK_CLIENT_SECRET,
      issuer: env.KEYCLOAK_ISSUER,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
} satisfies NextAuthConfig;
