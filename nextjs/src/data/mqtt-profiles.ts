"use server";

import { type ApiListResponse } from "./shared";

import { type RawNavItem } from "@/components/layout/Sidebar/utils/NavItems";
import { authenticatedBitswanBackendInstance } from "@/server/bitswan-backend";
import { getActiveOrgFromCookies } from "./organisations";

export type MQTTProfile = {
  id: string;
  name: string;
  group_id: string;
  is_admin: string;
  nav_items: RawNavItem[];
};
export type MQTTProfileListResponse = ApiListResponse<MQTTProfile>;

export const fetchMQTTProfiles = async () => {
  const bitswanBEInstance = await authenticatedBitswanBackendInstance();
  const activeOrg = await getActiveOrgFromCookies();

  try {
    const res = await bitswanBEInstance.get<MQTTProfileListResponse>(
      `/user-groups/mqtt_profiles`,
      {
        headers: {
          "X-Org-Id": activeOrg?.id ?? "",
          "X-Org-Name": activeOrg?.name ?? "",
        },
      },
    );
    return { ...res.data, status: "success" as const };
  } catch (error) {
    console.error("Error fetching MQTT profiles", error);
    return {
      status: "error" as const,
      message: "Error fetching MQTT profiles",
      results: [],
      next: null,
      previous: null,
      count: 0,
    };
  }
};
