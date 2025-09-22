"use server";

import { ACTIVE_ORG_COOKIE_NAME } from "@/shared/constants";
import { authenticatedBitswanBackendInstance } from "@/server/bitswan-backend";
import { cookies } from "next/headers";
import { type ApiListResponse, type ApiResponse } from "./shared";

export type Organisation = {
  id: string;
  name: string;
};

export type OrgListResponse = ApiListResponse<Organisation>;

export const getActiveOrgFromCookies = async () => {
  const orgs = (await fetchOrgs()).results;

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ACTIVE_ORG_COOKIE_NAME)?.value;
  let activeOrg = undefined;

  if (cookieValue && orgs.some((org) => org.id === cookieValue)) {
    activeOrg = orgs.find((org) => org.id === cookieValue);
  } else {
    activeOrg = orgs[0] ?? undefined;
  }

  return activeOrg;
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
      const axiosError = error as any;
      if (axiosError.response) {
        console.error("API Error Response:", axiosError.response.data);
        console.error("API Error Status:", axiosError.response.status);
        errorMessage = `API Error (${axiosError.response.status}): ${axiosError.response.data?.error || axiosError.response.data?.message || errorMessage}`;
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

export const createOrg = async (name: string) => {
  const bitswanBEInstance = await authenticatedBitswanBackendInstance();

  try {
    const res = await bitswanBEInstance.post<ApiResponse<Organisation>>(
      "/orgs/",
      {
        name,
      },
    );
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
