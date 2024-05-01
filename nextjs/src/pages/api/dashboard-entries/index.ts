import { env } from "@/env.mjs";
import { getServerAuthSession } from "@/server/auth";
import axios from "axios";
import {
  type DashboardEntryListResponse,
  type DashboardEntryCreateRequest,
} from "@/types/dashboardList";
import { type NextApiRequest, type NextApiResponse } from "next";

const CDS_API_URL = env.CDS_API_URL;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DashboardEntryListResponse>,
) {
  const session = await getServerAuthSession({ req, res });

  if (req.method === "GET") {
    const response = await axios.get<DashboardEntryListResponse>(
      `${CDS_API_URL}/api/dashboard-entries`,
      {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      },
    );

    console.log("response", response.data);

    res.status(response.status).json(response.data);
  }

  if (req.method === "POST") {
    const reqPayload = req.body as DashboardEntryCreateRequest;

    const response = await axios.post<DashboardEntryListResponse>(
      `${CDS_API_URL}/api/dashboard-entries`,
      {
        name: reqPayload.name,
        description: reqPayload.description,
        url: reqPayload.url,
      },
      {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      },
    );

    res.status(response.status).json(response.data);
  }

  res.status(405).end();
}
