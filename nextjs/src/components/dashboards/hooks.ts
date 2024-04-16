import axios, { type AxiosError } from "axios";

import { useQuery } from "@tanstack/react-query";
import { signIn, useSession } from "next-auth/react";
import { env } from "@/env.mjs";
import { type DashboardEntry } from "@/types/dashboardList";

type DashboardEntryCreateResponse = {
  id: string;
  name: string;
  url: string;
  description: string;
};

type DashboardEntryListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: DashboardEntry[];
};

const BASE_API_URL = `${env.NEXT_PUBLIC_BITSWAN_BACKEND_API_URL}/api`;

export const fetchDashboardEntryList = (
  apiToken?: string,
): Promise<DashboardEntryListResponse> =>
  axios
    .get<DashboardEntryListResponse>(`${BASE_API_URL}/dashboard-entries/`, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    })
    .then((response) => response.data)
    .catch((error: AxiosError) => {
      if (error.response?.status === 403) {
        console.error("Unauthorized");
        void signIn("keycloak");
      }

      throw error;
    });

export const createDashboardEntry = (params: {
  apiToken: string;
  dashboardEntry: Omit<DashboardEntry, "id">;
}): Promise<DashboardEntryCreateResponse> => {
  return axios
    .post<DashboardEntryCreateResponse>(
      `${BASE_API_URL}/dashboard-entries/`,
      {
        name: params.dashboardEntry.name,
        description: params.dashboardEntry.description,
        url: params.dashboardEntry.url,
      },
      {
        headers: {
          Authorization: `Bearer ${params.apiToken}`,
        },
      },
    )
    .then((response) => response.data);
};

export const updateDashboardEntry = (params: {
  apiToken: string;
  dashboardEntry: DashboardEntry;
}): Promise<DashboardEntry> =>
  axios
    .put<DashboardEntry>(
      `${BASE_API_URL}/dashboard-entries/${params.dashboardEntry.id}/`,
      {
        name: params.dashboardEntry.name,
        description: params.dashboardEntry.description,
        url: params.dashboardEntry.url,
      },
      {
        headers: {
          Authorization: `Bearer ${params.apiToken}`,
        },
      },
    )
    .then((response) => response.data);

export const deleteDashboardEntry = (params: {
  apiToken: string;
  id: string;
}): Promise<void> =>
  axios.delete(`${BASE_API_URL}/dashboard-entries/${params.id}`, {
    headers: {
      Authorization: `Bearer ${params.apiToken}`,
    },
  });

export const useDashboardEntryList = () => {
  const { data: session } = useSession();

  const encryptedAccessToken = session?.access_token;

  return useQuery({
    queryKey: ["dashboard-entries", encryptedAccessToken],
    queryFn: () => fetchDashboardEntryList(encryptedAccessToken),
    enabled: !!encryptedAccessToken,
  });
};
