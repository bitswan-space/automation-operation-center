import {
  adminClient,
  organizationClient,
  ssoClient,
} from "better-auth/client/plugins";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // FIXME: Load this from env
  baseURL: "http://localhost:3000",
  plugins: [adminClient(), organizationClient(), ssoClient()],
});
