import { authenticatedBitswanBackendInstance } from "@/server/bitswan-backend";

type AutomationServerListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: AutomationServer[];
};

export type Workspace = {
  id: number;
  name: string;
  keycloak_org_id: string;
  automation_server: string;
  created_at: string;
  updated_at: string;
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

export async function getAutomationServers() {
  const bitswanBEInstance = await authenticatedBitswanBackendInstance();

  const res = await bitswanBEInstance.get("/automation-servers");
  return res.data as AutomationServerListResponse;
}
