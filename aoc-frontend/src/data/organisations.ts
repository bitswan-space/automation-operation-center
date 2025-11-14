import { ACTIVE_ORG_COOKIE_NAME } from "@/shared/constants";
import { authenticatedBitswanBackendInstance } from "@/lib/api-client";
import { type ApiListResponse, type ApiResponse } from "./shared";
import { type AxiosError } from "axios";

export type Organisation = {
  id: string;
  name: string;
};

export type OrgListResponse = ApiListResponse<Organisation>;

export const getActiveOrgFromCookies = async () => {
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith(ACTIVE_ORG_COOKIE_NAME))
    ?.split('=')[1];

  if (!cookieValue) {
    return undefined;
  }

  const org = await fetchOrg(cookieValue);
  if (org.status === "success") {
    return org.data;
  }

  return undefined;
};

export const fetchOrgs = async () => {
  try {
    const bitswanBEInstance = await authenticatedBitswanBackendInstance();

    const res =
      await bitswanBEInstance.get<ApiListResponse<Organisation>>("/orgs");
    return { ...res.data, status: "success" as const };
  } catch (error) {
    console.error("Error fetching orgs", error);
    
    // Provide more detailed error information
    let errorMessage = "Error fetching orgs";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    // Check if it's an axios error for more details
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as AxiosError<{ error?: string; message?: string }>;
      if (axiosError.response) {
        console.error("API Error Response:", axiosError.response.data);
        console.error("API Error Status:", axiosError.response.status);
        errorMessage = `API Error (${axiosError.response.status}): ${axiosError.response.data?.error ?? axiosError.response.data?.message ?? errorMessage}`;
      } else if (axiosError.request) {
        console.error("Network Error:", axiosError.request);
        errorMessage = "Network error - unable to reach the API";
      }
    }
    
    return {
      status: "error" as const,
      message: errorMessage,
      results: [],
      next: null,
      previous: null,
      count: 0,
    };
  }
};

export const fetchOrg = async (orgId: string) => {
  try {
    const bitswanBEInstance = await authenticatedBitswanBackendInstance();

    const res =
      await bitswanBEInstance.get<ApiResponse<Organisation>>(`/orgs/${orgId}`);
    return { data: res.data, status: "success" as const };
  } catch (error) {
    console.error("Error fetching org by id", error);
    
    // Provide more detailed error information
    let errorMessage = "Error fetching org by id";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    // Check if it's an axios error for more details
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as AxiosError<{ error?: string; message?: string }>;
      if (axiosError.response) {
        console.error("API Error Response:", axiosError.response.data);
        console.error("API Error Status:", axiosError.response.status);
        errorMessage = `API Error (${axiosError.response.status}): ${axiosError.response.data?.error ?? axiosError.response.data?.message ?? errorMessage}`;
      } else if (axiosError.request) {
        console.error("Network Error:", axiosError.request);
        errorMessage = "Network error - unable to reach the API";
      }
    }
    
    return {
      status: "error" as const,
      message: errorMessage,
      data: null,
    };
  }
};

export const createOrg = async (name: string) => {
  const bitswanBEInstance = await authenticatedBitswanBackendInstance();

  try {
    // The Django API returns the organization data directly, not wrapped in ApiResponse
    const res = await bitswanBEInstance.post<Organisation>(
      "/orgs/",
      {
        name,
      },
    );
    // Return the organization data with success status
    return { ...res.data, status: "success" as const };
  } catch (error) {
    console.error("Error creating org", error);
    return {
      status: "error" as const,
      message: "Error creating org",
      data: null,
    };
  }
};