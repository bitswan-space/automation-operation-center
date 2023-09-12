// pages/api/logout.ts (or another appropriate name)

import { type NextApiRequest, type NextApiResponse } from "next";

import { getServerAuthSession } from "@/server/auth";
import { env } from "@/env.mjs";
import { getIdToken } from "@/utils/sessionTokenAccessor";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const session = await getServerAuthSession({
      req,
      res,
    });

    if (!session) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const idToken = await getIdToken({ req, res });
    const url = `${env.KEYCLOAK_END_SESSION_URL}?id_token_hint=${idToken}&post_logout_redirect_uri=${env.KEYCLOAK_POST_LOGOUT_REDIRECT_URI}`;

    try {
      await fetch(url, { method: "GET" });
      return res.status(200).json({ message: "Logged out successfully" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default handler;
