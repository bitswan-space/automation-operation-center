import { auth } from "@/server/auth";
import axios from "axios";
import { env } from "@/env.mjs";

type AutomationServerListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: AutomationServer[];
};

type Workspace = {
  id: string;
  name: string;
  keycloak_org_id: string;
  automation_server_id: string;
  created_at: string;
  updated_at: string;
};

export type AutomationServer = {
  id: number;
  name: string;
  workspaces?: Workspace[];
  automation_server_id: string;
  automations: number;
  isConnected: boolean;
  updated_at: string;
  created_at: string;
};

// Will move to a separate file
export const authenticatedBitswanBackendInstance = async () => {
  const BITSWAN_BACKEND_API_URL = env.BITSWAN_BACKEND_API_URL + "/api";

  const session = await auth();
  if (!session) {
    // Handle the case when the user is not authenticated
    throw new Error("Not authenticated");
  }

  const apiToken = session?.access_token;

  return axios.create({
    baseURL: BITSWAN_BACKEND_API_URL,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
  });
};

export async function getAutomationServers() {
  const bitswanBEInstance = await authenticatedBitswanBackendInstance();

  const res = await bitswanBEInstance.get("/automation-servers");
  return res.data as AutomationServerListResponse;
}
