import { type ApiListResponse } from "./shared";

import { type RawNavItem } from "@/components/layout/Sidebar/utils/NavItems";
import { authenticatedBitswanBackendInstance } from "@/lib/api-client";
import { getActiveOrgFromCookies } from "./organisations";

export type Profile = {
  id: string;
  name: string;
  nav_items: RawNavItem[];
};

export type ProfileListResponse = ApiListResponse<Profile>;

export const fetchProfiles = async ({ pageParam = 1 }: { pageParam?: number } = {}) => {
  const bitswanBEInstance = await authenticatedBitswanBackendInstance();
  const activeOrg = await getActiveOrgFromCookies();

  try {
    const res = await bitswanBEInstance.get<ProfileListResponse>(
      `/profiles`,
      {
        params: {
          page: pageParam,
        },
        headers: {
          "X-Org-Id": activeOrg?.id ?? "",
          "X-Org-Name": activeOrg?.name ?? "",
        },
      },
    );
    return { ...res.data, status: "success" as const };
  } catch (error) {
    console.error("Error fetching profiles", error);
    return {
      status: "error" as const,
      message: "Error fetching profiles",
      results: [],
      next: null,
      previous: null,
      count: 0,
    };
  }
};
