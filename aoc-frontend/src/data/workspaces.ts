import { authenticatedBitswanBackendInstance } from "@/lib/api-client";
import { ApiListResponse } from "./shared";
import { getActiveOrgFromCookies } from "./organisations";

export type Workspace = {
  id: string;
  name: string;
  group_memberships?: WorkspaceGroupMembership[];
  keycloak_org_id: string;
  automation_server: string;
  created_at: string;
  updated_at: string;
  editor_url: string | null;
};

export type WorkspaceGroupMembership = {
  id: number;
  workspace: string;
  keycloak_group_id: string;
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
