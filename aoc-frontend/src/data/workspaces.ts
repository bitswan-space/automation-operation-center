import { authenticatedBitswanBackendInstance } from "@/lib/api-client";
import { ApiListResponse, ApiResponse } from "./shared";
import { getActiveOrgFromCookies } from "./organisations";

export type Workspace = {
  id: string;
  name: string;
  keycloak_org_id: string;
  workspace_group_id?: string | null;
  automation_server: string;
  created_at: string;
  updated_at: string;
  editor_url: string | null;
};

export type WorkspaceGroup = {
  id: string;
  name: string;
  path: string;
  tag_color: string | null;
  permissions: string[];
  description: string | null;
};

export type WorkspaceGroupUser = {
  id: string;
  username: string;
  email: string;
  emailVerified?: boolean;
  firstName?: string;
  lastName?: string;
};

export type WorkspacesListResponse = ApiListResponse<Workspace>;

export const getWorkspaces = async (
  page: number | undefined = 1,
  search?: string,
  automationServerId?: string
): Promise<WorkspacesListResponse> => {
  const bitswanBEInstance = await authenticatedBitswanBackendInstance();
  const activeOrg = await getActiveOrgFromCookies();

  try {
    const params: Record<string, string | number> = {
      page: page,
    };
    if (search && search.trim()) {
      params.search = search.trim();
    }
    if (automationServerId) {
      params.automation_server_id = automationServerId;
    }
    const res = await bitswanBEInstance.get<WorkspacesListResponse>(
      `/workspaces`,
      {
        params,
        headers: {
          "X-Org-Id": activeOrg?.id ?? "",
          "X-Org-Name": activeOrg?.name ?? "",
        },
      },
    );
    return { ...res.data, status: "success" as const };
  } catch (error) {
    console.error("Error fetching workspaces", error);
    return {
      status: "error" as const,
      message: "Error fetching workspaces",
      results: [],
      next: null,
      previous: null,
      count: 0,
    };
  }
};


export const getWorkspaceById = async (workspaceId: string): Promise<Workspace | null> => {
  const bitswanBEInstance = await authenticatedBitswanBackendInstance();
  const activeOrg = await getActiveOrgFromCookies();

  try {
    const res = await bitswanBEInstance.get<Workspace>(
    `/workspaces/${workspaceId}`,
    {
      headers: {
        "X-Org-Id": activeOrg?.id ?? "",
        "X-Org-Name": activeOrg?.name ?? "",
      },
    },
  );
    return res.data;
  } catch (error) {
    console.error("Error fetching workspace", error);
    return null
  }
};

export const getWorkspaceGroups = async (workspaceId: string): Promise<WorkspaceGroup[]> => {
  const bitswanBEInstance = await authenticatedBitswanBackendInstance();
  const activeOrg = await getActiveOrgFromCookies();

  try {
    const res = await bitswanBEInstance.get<WorkspaceGroup[]>(
      `/workspaces/${workspaceId}/groups`,
      {
        headers: {
          "X-Org-Id": activeOrg?.id ?? "",
          "X-Org-Name": activeOrg?.name ?? "",
        },
      },
    );
    return res.data;
  } catch (error) {
    console.error("Error fetching workspace groups", error);
    return [];
  }
};

export const getWorkspaceUsers = async (
  workspaceId: string
): Promise<WorkspaceGroupUser[]> => {
  const bitswanBEInstance = await authenticatedBitswanBackendInstance();
  const activeOrg = await getActiveOrgFromCookies();

  try {
    const res = await bitswanBEInstance.get<WorkspaceGroupUser[]>(
      `/workspaces/${workspaceId}/users`,
      {
        headers: {
          "X-Org-Id": activeOrg?.id ?? "",
          "X-Org-Name": activeOrg?.name ?? "",
        },
      },
    );
    return res.data;
  } catch (error) {
    console.error("Error fetching workspace users", error);
    return [];
  }
};

export const getWorkspaceNonMemberGroups = async (
  workspaceId: string
): Promise<WorkspaceGroup[]> => {
  const bitswanBEInstance = await authenticatedBitswanBackendInstance();
  const activeOrg = await getActiveOrgFromCookies();

  try {
    const res = await bitswanBEInstance.get<WorkspaceGroup[]>(
      `/workspaces/${workspaceId}/non-member-groups`,
      {
        headers: {
          "X-Org-Id": activeOrg?.id ?? "",
          "X-Org-Name": activeOrg?.name ?? "",
        },
      },
    );
    return res.data;
  } catch (error) {
    console.error("Error fetching workspace non-member groups", error);
    return [];
  }
};

export const getWorkspaceNonMemberUsers = async (
  workspaceId: string
): Promise<WorkspaceGroupUser[]> => {
  const bitswanBEInstance = await authenticatedBitswanBackendInstance();
  const activeOrg = await getActiveOrgFromCookies();

  try {
    const res = await bitswanBEInstance.get<WorkspaceGroupUser[]>(
      `/workspaces/${workspaceId}/non-member-users`,
      {
        headers: {
          "X-Org-Id": activeOrg?.id ?? "",
          "X-Org-Name": activeOrg?.name ?? "",
        },
      },
    );
    return res.data;
  } catch (error) {
    console.error("Error fetching workspace non-member users", error);
    return [];
  }
};

export const addUserToWorkspace = async (
  workspaceId: string,
  userId: string
): Promise<ApiResponse<null>> => {
  const bitswanBEInstance = await authenticatedBitswanBackendInstance();
  const activeOrg = await getActiveOrgFromCookies();

  try {
    const res = await bitswanBEInstance.post<ApiResponse>(
      `/workspaces/${workspaceId}/add_user/`,
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
    return { ...res.data, status: "success" as const, data: null };
  } catch (error) {
    console.error("Error adding user to workspace", error);
    return {
      status: "error" as const,
      message: "Error adding user to workspace",
      data: null,
    };
  }
};

export const removeUserFromWorkspace = async (
  workspaceId: string,
  userId: string
): Promise<ApiResponse<null>> => {
  const bitswanBEInstance = await authenticatedBitswanBackendInstance();
  const activeOrg = await getActiveOrgFromCookies();

  try {
    const res = await bitswanBEInstance.post<ApiResponse>(
      `/workspaces/${workspaceId}/remove_user/`,
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
    return { ...res.data, status: "success" as const, data: null };
  } catch (error) {
    console.error("Error removing user from workspace", error);
    return {
      status: "error" as const,
      message: "Error removing user from workspace",
      data: null,
    };
  }
};
