"use server";

import { authenticatedBitswanBackendInstance } from "@/server/bitswan-backend";
import { getActiveOrgFromCookies } from "./organisations";

export type TokenData = {
  automation_server_id: string;
  workspace_id: string;
  token: string;
};

type GetMQTTTokensResponse = {
  tokens: TokenData[];
};

export async function getMQTTTokens() {
  const bitswanBEInstance = await authenticatedBitswanBackendInstance();
  const activeOrg = await getActiveOrgFromCookies();

  const res = await bitswanBEInstance.get<GetMQTTTokensResponse>(
    "/frontend/user/emqx/jwts",
    {
      headers: {
        "X-Org-Id": activeOrg?.id ?? "",
        "X-Org-Name": activeOrg?.name ?? "",
      },
    },
  );

  return res.data?.tokens ?? [];
}
