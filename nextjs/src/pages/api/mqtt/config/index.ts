import type { NextApiRequest, NextApiResponse } from "next";

import { env } from "@/env.mjs";

export type MQTTConfig = {
  url: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<MQTTConfig | { error: string }>,
) {
  try {
    if (req.method !== "GET") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const mqttUrl = env.EMQX_MQTT_URL;

    res.status(200).json({ url: mqttUrl });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
}
