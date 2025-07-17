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
  const activeOrgId =
    cookieStore.get(ACTIVE_ORG_COOKIE_NAME)?.value ?? orgs[0]?.id;
  return orgs.find((org) => org.id === activeOrgId);
};

export const fetchOrgs = async () => {
  const bitswanBEInstance = await authenticatedBitswanBackendInstance();

  try {
    const res =
      await bitswanBEInstance.get<ApiListResponse<Organisation>>("/orgs");
    return { ...res.data, status: "success" as const };
  } catch (error) {
    console.error("Error fetching orgs", error);
    return {
      status: "error" as const,
      message: "Error fetching orgs",
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
