import { type ApiListResponse, type ApiResponse } from "./shared";
import { type UserGroup, type UserGroupsListResponse } from "./groups";
import { authenticatedBitswanBackendInstance } from "@/lib/api-client";
import { getActiveOrgFromCookies } from "./organisations";

export type OrgUser = {
  name: string;
  id: string;
  email: string;
  verified: boolean;
  groups: UserGroup[];
};

export type OrgUsersListResponse = ApiListResponse<OrgUser>;

export const fetchOrgUsers = async (page: number | undefined = 1): Promise<OrgUsersListResponse> => {
  const activeOrg = await getActiveOrgFromCookies();

  try {
    const bitswanBEInstance = await authenticatedBitswanBackendInstance();
    const response = await bitswanBEInstance.get<ApiListResponse<OrgUser>>(
      `/org-users?page=${page}`,
      {
        headers: {
          "X-Org-Id": activeOrg?.id ?? "",
          "X-Org-Name": activeOrg?.name ?? "",
        },
      }
    );
    return { ...response.data, status: "success" as const };
  } catch (error) {
    console.error("Error fetching users", error);
    throw error;
  }
};

export const inviteUser = async (email: string): Promise<ApiResponse<null>> => {
  const activeOrg = await getActiveOrgFromCookies();

  try {
    const bitswanBEInstance = await authenticatedBitswanBackendInstance();
    const response = await bitswanBEInstance.post<ApiResponse<null>>(
      "/org-users/invite/",
      { email },
      {
        headers: {
          "X-Org-Id": activeOrg?.id ?? "",
          "X-Org-Name": activeOrg?.name ?? "",
        },
      }
    );
    return { ...response.data, status: "success" as const };
  } catch (error) {
    console.error("Error inviting user", error);
    throw error;
  }
};

export const deleteUser = async (id: string): Promise<ApiResponse<null>> => {
  const activeOrg = await getActiveOrgFromCookies();

  try {
    const bitswanBEInstance = await authenticatedBitswanBackendInstance();
    const response = await bitswanBEInstance.delete<ApiResponse<null>>(
      `/org-users/${id}`,
      {
        headers: {
          "X-Org-Id": activeOrg?.id ?? "",
          "X-Org-Name": activeOrg?.name ?? "",
        },
      }
    );
    return { ...response.data, status: "success" as const };
  } catch (error) {
    console.error("Error deleting user", error);
    throw error;
  }
};

export const fetchUserNonMemberGroups = async (
  userId: string,
  page: number | undefined = 1,
  search?: string
): Promise<UserGroupsListResponse> => {
  const activeOrg = await getActiveOrgFromCookies();

  try {
    const bitswanBEInstance = await authenticatedBitswanBackendInstance();
    const params: Record<string, string | number> = {
      page: page,
    };
    if (search && search.trim()) {
      params.search = search.trim();
    }
    
    const response = await bitswanBEInstance.get<ApiListResponse<UserGroup>>(
      `/org-users/${userId}/non_member_groups/`,
      {
        params,
        headers: {
          "X-Org-Id": activeOrg?.id ?? "",
          "X-Org-Name": activeOrg?.name ?? "",
        },
      }
    );
    return { ...response.data, status: "success" as const };
  } catch (error) {
    console.error("Error fetching user non-member groups", error);
    return {
      status: "error" as const,
      message: "Error fetching user non-member groups",
      results: [],
      next: null,
      previous: null,
      count: 0,
    };
  }
};