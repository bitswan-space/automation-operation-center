import { type NextApiRequest, type NextApiResponse } from "next";

import { getServerAuthSession } from "@/server/auth";

export async function getAccessToken() {
  const session = await getServerAuthSession();

  if (session) {
    const accessTokenDecrypted = session.access_token;
    return accessTokenDecrypted;
  }
  return null;
}

export async function getIdToken(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerAuthSession(req, res);

  if (session) {
    const idTokenDecrypted = session.id_token;
    return idTokenDecrypted;
  }
  return null;
}
