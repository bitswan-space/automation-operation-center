import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]),
    NEXTAUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string().min(1)
        : z.string().min(1).optional(),
    NEXTAUTH_URL: z.preprocess(
      // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
      // Since NextAuth.js automatically uses the VERCEL_URL if present.
      (str) => process.env.VERCEL_URL ?? str,
      // VERCEL_URL doesn't include `https` so it cant be validated as a URL
      process.env.VERCEL ? z.string().min(1) : z.string().url(),
    ),

    // PORTAINER
    PORTAINER_ACCESS_TOKEN: z.string().min(1),
    PORTAINER_BASE_URL: z.string().min(1),

    // INFLUX
    INFLUXDB_URL: z.string().url(),
    INFLUXDB_TOKEN: z.string().min(1),
    INFLUXDB_ORG: z.string().min(1),
    INFLUXDB_BUCKET: z.string().min(1),
    INFLUXDB_USERNAME: z.string().min(1),
    INFLUXDB_PASSWORD: z.string().min(1),

    // KEYCLOAK
    KEYCLOAK_CLIENT_SECRET: z.string().min(1),
    KEYCLOAK_CLIENT_ID: z.string().min(1),
    KEYCLOAK_ISSUER: z.string().url(),
    KEYCLOAK_REFRESH_URL: z.string().url(),
    KEYCLOAK_END_SESSION_URL: z.string().url(),
    KEYCLOAK_POST_LOGOUT_REDIRECT_URI: z.string().url(),

    // MQTT
    MQTT_URL: z.string().url(),
    CCS_CONFIG_KEY: z.string().min(1),
    PREPARE_MQTT_SERVICE_URL: z.string().url(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_MQTT_URL: z.string().min(1),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,

    // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
    PORTAINER_ACCESS_TOKEN: process.env.PORTAINER_ACCESS_TOKEN,
    PORTAINER_BASE_URL: process.env.PORTAINER_BASE_URL,

    // INFLUX
    INFLUXDB_URL: process.env.INFLUXDB_URL,
    INFLUXDB_TOKEN: process.env.INFLUXDB_TOKEN,
    INFLUXDB_ORG: process.env.INFLUXDB_ORG,
    INFLUXDB_BUCKET: process.env.INFLUXDB_BUCKET,
    INFLUXDB_USERNAME: process.env.INFLUXDB_USERNAME,
    INFLUXDB_PASSWORD: process.env.INFLUXDB_PASSWORD,

    // KEYCLOAK
    KEYCLOAK_CLIENT_SECRET: process.env.KEYCLOAK_CLIENT_SECRET,
    KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID,
    KEYCLOAK_ISSUER: process.env.KEYCLOAK_ISSUER,
    KEYCLOAK_REFRESH_URL: process.env.KEYCLOAK_REFRESH_URL,
    KEYCLOAK_END_SESSION_URL: process.env.KEYCLOAK_END_SESSION_URL,
    KEYCLOAK_POST_LOGOUT_REDIRECT_URI:
      process.env.KEYCLOAK_POST_LOGOUT_REDIRECT_URI,

    // MQTT
    MQTT_URL: process.env.MQTT_URL,
    CCS_CONFIG_KEY: process.env.CCS_CONFIG_KEY,
    PREPARE_MQTT_SERVICE_URL: process.env.PREPARE_MQTT_SERVICE_URL,
    NEXT_PUBLIC_MQTT_URL: process.env.NEXT_PUBLIC_MQTT_URL,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
   * This is especially useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
