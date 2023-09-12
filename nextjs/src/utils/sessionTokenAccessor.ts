import { type ServerAuthSessionCtx, getServerAuthSession } from "@/server/auth";

import { decrypt } from "./encryption";

export async function getAccessToken(ctx: ServerAuthSessionCtx) {
  const session = await getServerAuthSession(ctx);

  if (session) {
    const accessTokenDecrypted = decrypt(session.access_token);
    return accessTokenDecrypted;
  }
  return null;
}

export async function getIdToken(ctx: ServerAuthSessionCtx) {
  const session = await getServerAuthSession(ctx);

  if (session) {
    const idTokenDecrypted = decrypt(session.id_token);
    return idTokenDecrypted;
  }
  return null;
}
