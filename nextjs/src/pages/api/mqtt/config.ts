import type { NextApiRequest, NextApiResponse } from "next";

import { env } from "@/env.mjs";

export type MQTTConfigResponse = {
  url: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<MQTTConfigResponse>,
) {
  const mqttURL = env.MQTT_URL;
  res.status(200).json({ url: mqttURL });
}
