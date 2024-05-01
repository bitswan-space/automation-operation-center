import axios, { type AxiosError } from "axios";

import { useQuery } from "@tanstack/react-query";
import {
  type DashboardEntryCreateRequest,
  type DashboardEntryCreateResponse,
  type DashboardEntryListResponse,
  type DashboardEntry,
} from "@/types/dashboard-hub";

export const fetchDashboardEntryList =
  (): Promise<DashboardEntryListResponse> =>
    axios
      .get<DashboardEntryListResponse>(`/api/dashboard-entries`)
      .then((response) => response.data)
      .catch((error: AxiosError) => {
        throw error;
      });

export const createDashboardEntry = (params: {
  dashboardEntry: DashboardEntryCreateRequest;
}): Promise<DashboardEntryCreateResponse> => {
  return axios
    .post<DashboardEntryCreateResponse>(`/api/dashboard-entries/`, {
      name: params.dashboardEntry.name,
      description: params.dashboardEntry.description,
      url: params.dashboardEntry.url,
    })
    .then((response) => response.data);
};

export const updateDashboardEntry = (params: {
  dashboardEntry: DashboardEntry;
}): Promise<DashboardEntry> =>
  axios
    .put<DashboardEntry>(
      `/api/dashboard-entries/${params.dashboardEntry.id}/`,
      {
        name: params.dashboardEntry.name,
        description: params.dashboardEntry.description,
        url: params.dashboardEntry.url,
      },
    )
    .then((response) => response.data);

export const deleteDashboardEntry = (params: { id: string }): Promise<void> =>
  axios.delete(`/api/dashboard-entries/${params.id}`);

export const useDashboardEntryList = () => {
  return useQuery({
    queryKey: ["dashboard-entries"],
    queryFn: () => fetchDashboardEntryList(),
  });
};
