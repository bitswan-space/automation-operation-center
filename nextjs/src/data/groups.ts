"use server";

import { authenticatedBitswanBackendInstance } from "@/server/bitswan-backend";
import { type ApiResponse, type ApiListResponse } from "./shared";
import { type NavItem } from "@/components/layout/Sidebar/utils/NavItems";
import { getActiveOrgFromCookies } from "./organisations";

export type UserGroup = {
  name: string;
  id: string;
  tag_color: string;
  description: string;
  active: boolean;
};

export type UserGroupsListResponse = ApiListResponse<UserGroup>;

export const fetchOrgGroups = async () => {
  const bitswanBEInstance = await authenticatedBitswanBackendInstance();
  const activeOrg = await getActiveOrgFromCookies();

  try {
    const res = await bitswanBEInstance.get<ApiListResponse<UserGroup>>(
      "/user-groups",
      {
        headers: {
          "X-Org-Id": activeOrg?.id ?? "",
          "X-Org-Name": activeOrg?.name ?? "",
        },
      },
    );
    return { ...res.data, status: "success" as const };
  } catch (error) {
    console.error("Error fetching org groups", error);
    return {
      status: "error" as const,
      message: "Error fetching org groups",
      results: [],
      next: null,
      previous: null,
      count: 0,
    };
  }
};

export const deleteOrgGroup = async (id: string) => {
  const bitswanBEInstance = await authenticatedBitswanBackendInstance();
  const activeOrg = await getActiveOrgFromCookies();

  try {
    const res = await bitswanBEInstance.delete<ApiResponse>(
      `/user-groups/${id}`,
      {
        headers: {
          "X-Org-Id": activeOrg?.id ?? "",
          "X-Org-Name": activeOrg?.name ?? "",
        },
      },
    );
    return { ...res.data, status: "success" as const };
  } catch (error) {
    console.error("Error deleting org group", error);
    return {
      status: "error" as const,
      message: "Error deleting org group",
      data: null,
    };
  }
};

export const addUserToGroup = async (userId: string, groupId: string) => {
  const bitswanBEInstance = await authenticatedBitswanBackendInstance();
  const activeOrg = await getActiveOrgFromCookies();

  try {
    const res = await bitswanBEInstance.post<ApiResponse>(
      `/user-groups/${groupId}/add_member/`,
      {
        user_id: userId,
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
    console.error("Error adding user to group", error);
    return {
      status: "error" as const,
      message: "Error adding user to group",
      data: null,
    };
  }
};

export const removeUserFromGroup = async (userId: string, groupId: string) => {
  const bitswanBEInstance = await authenticatedBitswanBackendInstance();
  const activeOrg = await getActiveOrgFromCookies();

  try {
    const res = await bitswanBEInstance.post<ApiResponse>(
      `/user-groups/${groupId}/remove_member/`,
      {
        user_id: userId,
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
    console.error("Error removing user from group", error);
    return {
      status: "error" as const,
      message: "Error removing user from group",
      data: null,
    };
  }
};

export const createOrgGroup = async (userGroup: {
  name: string;
  description?: string;
  tag_color?: string;
  nav_items?: string;
}) => {
  const bitswanBEInstance = await authenticatedBitswanBackendInstance();
  const activeOrg = await getActiveOrgFromCookies();

  try {
    const res = await bitswanBEInstance.post<ApiResponse>(
      "/user-groups/",
      userGroup,
      {
        headers: {
          "X-Org-Id": activeOrg?.id ?? "",
          "X-Org-Name": activeOrg?.name ?? "",
        },
      },
    );
    return { ...res.data, status: "success" as const };
  } catch (error) {
    console.error("Error creating org group", error);
    return {
      status: "error" as const,
      message: "Error creating org group",
      data: null,
    };
  }
};

export const updateOrgGroup = async (userGroup: {
  id: string;
  name?: string;
  description?: string;
  tag_color?: string;
  nav_items?: NavItem[];
}) => {
  const bitswanBEInstance = await authenticatedBitswanBackendInstance();
  const activeOrg = await getActiveOrgFromCookies();

  try {
    const res = await bitswanBEInstance.put<ApiResponse>(
      `/user-groups/${userGroup.id}/`,
      userGroup,
      {
        headers: {
          "X-Org-Id": activeOrg?.id ?? "",
          "X-Org-Name": activeOrg?.name ?? "",
        },
      },
    );
    return { ...res.data, status: "success" as const };
  } catch (error) {
    console.error("Error updating org group", error);
    return {
      status: "error" as const,
      message: "Error updating org group",
      data: null,
    };
  }
};
