import { type ApiListResponse, type ApiResponse } from "./shared";

import { type UserGroup } from "./groups";
import { authenticatedBitswanBackendInstance } from "@/server/bitswan-backend";
import { getActiveOrgFromCookies } from "./organisations";

export type OrgUser = {
  name: string;
  id: string;
  email: string;
  verified: boolean;
  groups: UserGroup[];
};

export type OrgUsersListResponse = ApiListResponse<OrgUser>;

export const fetchOrgUsers = async () => {
  const bitswanBEInstance = await authenticatedBitswanBackendInstance();
  const activeOrg = await getActiveOrgFromCookies();

  try {
    const res = await bitswanBEInstance.get<ApiListResponse<OrgUser>>(
      "/org-users",
      {
        headers: {
          "X-Org-Id": activeOrg?.id ?? "",
          "X-Org-Name": activeOrg?.name ?? "",
        },
      },
    );
    return { ...res.data, status: "success" as const };
  } catch (error) {
    console.error("Error fetching org users", error);
    return {
      status: "error" as const,
      message: "Error fetching org users",
      results: [],
      next: null,
      previous: null,
      count: 0,
    };
  }
};

export const inviteUser = async (email: string) => {
  const bitswanBEInstance = await authenticatedBitswanBackendInstance();
  const activeOrg = await getActiveOrgFromCookies();
  try {
    const res = await bitswanBEInstance.post<ApiResponse>(
      "/org-users/invite/",
      {
        email: email,
      },
      {
        headers: {
          "X-Org-Id": activeOrg?.id ?? "",
          "X-Org-Name": activeOrg?.name ?? "",
        },
      },
    );
    return { ...res.data, status: "success" as const };
  } catch (error) {
    console.error("Error inviting user", error);
    return {
      status: "error" as const,
      message: "Error inviting user",
      data: null,
    };
  }
};

export const deleteUser = async (id: string) => {
  const bitswanBEInstance = await authenticatedBitswanBackendInstance();
  const activeOrg = await getActiveOrgFromCookies();
  try {
    const res = await bitswanBEInstance.delete<ApiResponse>(
      `/org-users/${id}/`,
      {
        headers: {
          "X-Org-Id": activeOrg?.id ?? "",
          "X-Org-Name": activeOrg?.name ?? "",
        },
      },
    );
    return { ...res.data, status: "success" as const };
  } catch (error) {
    console.error("Error deleting user", error);
    return {
      status: "error" as const,
      message: "Error deleting user",
      data: null,
    };
  }
};
