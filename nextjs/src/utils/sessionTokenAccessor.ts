import { type ServerAuthSessionCtx, getServerAuthSession } from "@/server/auth";


export async function getAccessToken(ctx: ServerAuthSessionCtx) {
  const session = await getServerAuthSession(ctx);

  if (session) {
    const accessTokenDecrypted = session.access_token;
    return accessTokenDecrypted;
  }
  return null;
}

export async function getIdToken(ctx: ServerAuthSessionCtx) {
  const session = await getServerAuthSession(ctx);

  if (session) {
    const idTokenDecrypted = session.id_token;
    return idTokenDecrypted;
  }
  return null;
}
