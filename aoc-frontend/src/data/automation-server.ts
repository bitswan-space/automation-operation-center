import { authenticatedBitswanBackendInstance } from "@/lib/api-client";
import { getActiveOrgFromCookies } from "./organisations";

type AutomationServerListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: AutomationServer[];
};

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

export type AutomationServer = {
  id: number;
  name: string;
  group_memberships?: AutomationServerGroupMembership[];
  workspaces?: Workspace[];
  automation_server_id: string;
  is_connected: boolean;
  updated_at: string;
  created_at: string;
};

export type WorkspaceGroupMembership = {
  id: number;
  workspace: string;
  keycloak_group_id: string;
};

export type AutomationServerGroupMembership = {
  id: number;
  automation_server: string;
  keycloak_group_id: string;
};

export async function getAutomationServers(page: number = 1, search?: string) {
  const bitswanBEInstance = await authenticatedBitswanBackendInstance();

  const activeOrg = await getActiveOrgFromCookies();

  const params: Record<string, string | number> = {
    page: page,
  };
  if (search && search.trim()) {
    params.search = search.trim();
  }

  const res = await bitswanBEInstance.get("/automation-servers", {
    params,
    headers: {
      "X-Org-Id": activeOrg?.id ?? "",
      "X-Org-Name": activeOrg?.name ?? "",
    },
  });

  return res.data as AutomationServerListResponse;
}

export async function deleteAutomationServer(serverId: string) {
  const bitswanBEInstance = await authenticatedBitswanBackendInstance();

  const activeOrg = await getActiveOrgFromCookies();

  const res = await bitswanBEInstance.post(`/automation-servers/${serverId}/delete/`, {}, {
    headers: {
      "X-Org-Id": activeOrg?.id ?? "",
      "X-Org-Name": activeOrg?.name ?? "",
    },
  });

  return res.data;
}

export async function createAutomationServerWithOTP(name: string) {
  const apiClient = await authenticatedBitswanBackendInstance();
  const activeOrg = await getActiveOrgFromCookies();
  
  const response = await apiClient.post('/automation-servers/create-with-otp', {
    name: name.trim(),
  }, {
    headers: {
      "X-Org-Id": activeOrg?.id ?? "",
      "X-Org-Name": activeOrg?.name ?? "",
    },
  });

  return response.data;
}

export async function checkAutomationServerOTPStatus(automationServerId: string) {
  const activeOrg = await getActiveOrgFromCookies();
  const apiClient = await authenticatedBitswanBackendInstance();
  const response = await apiClient.get(
    `/automation-servers/check-otp-status?automation_server_id=${automationServerId}`,
    {
      headers: {
        "X-Org-Id": activeOrg?.id ?? "",
        "X-Org-Name": activeOrg?.name ?? "",
      },
    }
  );

  return response.data;
}
