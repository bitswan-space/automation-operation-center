import { getServerAuthSession } from "@/server/auth";

export async function getAccessToken() {
  const session = await getServerAuthSession();

  if (session) {
    const accessTokenDecrypted = session.access_token;
    return accessTokenDecrypted;
  }
  return null;
}

export async function getIdToken() {
  const session = await getServerAuthSession();

  if (session) {
    const idTokenDecrypted = session.id_token;
    return idTokenDecrypted;
  }
  return null;
}
