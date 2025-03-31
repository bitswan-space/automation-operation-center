import { admin, organization } from "better-auth/plugins";

import { betterAuth } from "better-auth";
import { db } from "@/server/db";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sso } from "better-auth/plugins/sso";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  plugins: [admin(), organization(), sso()],
});
