import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]),
    AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string().min(1)
        : z.string().min(1).optional(),
    AUTH_URL: z.preprocess(
      // This makes Vercel deployments not fail if you don't set AUTH_URL
      // Since Auth.js automatically uses the VERCEL_URL if present.
      (str) => process.env.VERCEL_URL ?? str,
      // VERCEL_URL doesn't include `https` so it cant be validated as a URL
      process.env.VERCEL ? z.string().min(1) : z.string().url(),
    ),

    // INFLUX
    INFLUXDB_URL: z.string().url(),
    INFLUXDB_TOKEN: z.string().min(1),
    INFLUXDB_ORG: z.string().min(1),
    INFLUXDB_BUCKET: z.string().min(1),

    // KEYCLOAK
    KEYCLOAK_CLIENT_SECRET: z.string().min(1),
    KEYCLOAK_CLIENT_ID: z.string().min(1),
    KEYCLOAK_ISSUER: z.string().url(),
    KEYCLOAK_REFRESH_URL: z.string().url(),
    KEYCLOAK_END_SESSION_URL: z.string().url(),
    KEYCLOAK_POST_LOGOUT_REDIRECT_URI: z.string().url(),

    // EMQX
    EMQX_JWT_SECRET: z.string().min(1),
    EMQX_MQTT_URL: z.string(),

    // Bitswan Backend
    BITSWAN_BACKEND_API_URL: z.string().url(),

    AOC_BUILD_NO: z.string().min(1).optional(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_NODE_ENV: z.enum(["development", "test", "production"]),
    NEXT_PUBLIC_COMMIT_HASH: z.string().optional(),
    NEXT_PUBLIC_BUILD_NO: z.string().optional(),
    NEXT_PUBLIC_BITSWAN_EXPERIMENTAL: z.string().optional(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,

    AOC_BUILD_NO: process.env.AOC_BUILD_NO,

    // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,

    // INFLUX
    INFLUXDB_URL: process.env.INFLUXDB_URL,
    INFLUXDB_TOKEN: process.env.INFLUXDB_TOKEN,
    INFLUXDB_ORG: process.env.INFLUXDB_ORG,
    INFLUXDB_BUCKET: process.env.INFLUXDB_BUCKET,

    // KEYCLOAK
    KEYCLOAK_CLIENT_SECRET: process.env.KEYCLOAK_CLIENT_SECRET,
    KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID,
    KEYCLOAK_ISSUER: process.env.KEYCLOAK_ISSUER,
    KEYCLOAK_REFRESH_URL: process.env.KEYCLOAK_REFRESH_URL,
    KEYCLOAK_END_SESSION_URL: process.env.KEYCLOAK_END_SESSION_URL,
    KEYCLOAK_POST_LOGOUT_REDIRECT_URI:
      process.env.KEYCLOAK_POST_LOGOUT_REDIRECT_URI,

    NEXT_PUBLIC_NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_COMMIT_HASH: process.env.NEXT_PUBLIC_COMMIT_HASH,
    NEXT_PUBLIC_BUILD_NO: process.env.NEXT_PUBLIC_BUILD_NO,
    NEXT_PUBLIC_BITSWAN_EXPERIMENTAL: process.env.NEXT_PUBLIC_BITSWAN_EXPERIMENTAL,

    // AoC Backend
    BITSWAN_BACKEND_API_URL: process.env.BITSWAN_BACKEND_API_URL,

    // EMQX
    EMQX_JWT_SECRET: process.env.EMQX_JWT_SECRET,
    EMQX_MQTT_URL: process.env.EMQX_MQTT_URL,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
   * This is especially useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
