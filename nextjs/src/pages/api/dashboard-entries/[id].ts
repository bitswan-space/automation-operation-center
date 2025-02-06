import { env } from "@/env.mjs";
import { auth } from "@/server/auth";
import {
  type DashboardEntryListResponse,
  type DashboardEntryUpdateRequest,
} from "@/types/dashboard-hub";
import axios from "axios";
import { type NextApiRequest, type NextApiResponse } from "next";

const CDS_API_URL = env.CDS_API_URL;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DashboardEntryListResponse>,
) {
  const session = await auth();

  if (req.method === "PUT") {
    const { id } = req.query;
    const reqPayload = req.body as DashboardEntryUpdateRequest;

    const response = await axios.put<DashboardEntryListResponse>(
      `${CDS_API_URL}/api/dashboard-entries/${id as string}`,
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

  if (req.method === "DELETE") {
    const { id } = req.query;

    const response = await axios.delete<DashboardEntryListResponse>(
      `${CDS_API_URL}/api/dashboard-entries/${id as string}`,
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
