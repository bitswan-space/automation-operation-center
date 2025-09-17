"use server";

import { authenticatedBitswanBackendInstance } from "@/server/bitswan-backend";
import { type MQTTProfile } from "./mqtt-profiles";
import { getActiveOrgFromCookies } from "./organisations";

type GetMQTTTokenResponse = {
  token: string;
};

export type TokenData = {
  automation_server_id: string;
  workspace_id: string;
  token: string;
};

type GetMQTTTokensResponse = {
  tokens: TokenData[];
};

export async function getMQTTToken(activeMQTTProfile: MQTTProfile | null) {
  const bitswanBEInstance = await authenticatedBitswanBackendInstance();
  const activeOrg = await getActiveOrgFromCookies();

  const res = await bitswanBEInstance.get<GetMQTTTokenResponse>(
    `/profiles/${activeMQTTProfile?.group_id}/emqx/jwt`,
    {
      headers: {
        "X-Org-Id": activeOrg?.id ?? "",
        "X-Org-Name": activeOrg?.name ?? "",
      },
    },
  );

  return res.data?.token ?? null;
}

export async function getMQTTTokens() {
  const bitswanBEInstance = await authenticatedBitswanBackendInstance();
  const activeOrg = await getActiveOrgFromCookies();

  const res = await bitswanBEInstance.get<GetMQTTTokensResponse>(
    "/user/emqx/jwts",
    {
      headers: {
        "X-Org-Id": activeOrg?.id ?? "",
        "X-Org-Name": activeOrg?.name ?? "",
      },
    },
  );

  return res.data?.tokens ?? [];
}
