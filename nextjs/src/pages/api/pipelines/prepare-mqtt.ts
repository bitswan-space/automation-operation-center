import type { NextApiRequest, NextApiResponse } from "next";

import { type ServicePreparationResponse } from "@/types";
import axios from "axios";
import { env } from "@/env.mjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    ServicePreparationResponse | { error: { message: string } }
  >,
) {
  const CCS_CONFIG_KEY = env.CCS_CONFIG_KEY;
  const PREPARE_MQTT_SERVICE_URL = env.PREPARE_MQTT_SERVICE_URL;

  console.log("CCS_CONFIG_KEY", CCS_CONFIG_KEY);
  console.log("PREPARE_MQTT_SERVICE_URL", PREPARE_MQTT_SERVICE_URL);

  try {
    const response = await axios.post<ServicePreparationResponse>(
      PREPARE_MQTT_SERVICE_URL,
      {
        "trigger-key": CCS_CONFIG_KEY,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    console.log("response-data", response.data);
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: error as { message: string } });
  }
}
