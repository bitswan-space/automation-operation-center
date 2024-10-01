import type { NextApiRequest, NextApiResponse } from "next";

import { env } from "@/env.mjs";
import jwt from "jsonwebtoken";

export type EMQXJWTResponse = {
  token: string;
};

export type EMQXJWTRequest = {
  username: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<EMQXJWTResponse | { error: string }>,
) {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const { username } = req.body as EMQXJWTRequest;

    const jwtToken = jwt.sign({ username }, env.EMQX_JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ token: jwtToken });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
}
