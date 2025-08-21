import { authenticatedBitswanBackendInstance } from "@/server/bitswan-backend";
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

export async function getAutomationServers() {
  const bitswanBEInstance = await authenticatedBitswanBackendInstance();

  const activeOrg = await getActiveOrgFromCookies();

  const res = await bitswanBEInstance.get("/automation-servers", {
    headers: {
      "X-Org-Id": activeOrg?.id ?? "",
      "X-Org-Name": activeOrg?.name ?? "",
    },
  });

  return res.data as AutomationServerListResponse;
}
