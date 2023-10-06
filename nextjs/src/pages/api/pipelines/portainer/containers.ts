import { env } from "@/env.mjs";
import { type PortainerError, type DockerContainer } from "@/types";
import axios, { type AxiosError } from "axios";
import { type NextApiRequest, type NextApiResponse } from "next";
import https from "https";

const PORTAINER_BASE_URL = env.PORTAINER_BASE_URL + "api";

const ENDPOINTS_URL = `${PORTAINER_BASE_URL}/endpoints`;

const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // TODO: Hacky, not ideal for production
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DockerContainer | PortainerError>,
) {
  const accessToken = env.PORTAINER_ACCESS_TOKEN;
  const endpointId = req.query.endpointId as string;

  try {
    const response = await axios.get<DockerContainer>(
      `${ENDPOINTS_URL}/${endpointId}/docker/containers/json?all=1`,
      { httpsAgent, headers: { "X-API-Key": accessToken } },
    );
    res.status(200).json(response.data);
  } catch (error: unknown) {
    const responseStatus = (error as AxiosError)?.response?.status ?? 500;
    const responseMsg = (error as AxiosError)?.response?.data as PortainerError;
    res.status(responseStatus).json(responseMsg);
  }
}
