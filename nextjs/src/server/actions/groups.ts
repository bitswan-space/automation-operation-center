"use server";

import axios, { AxiosError } from "axios";

import { BITSWAN_BACKEND_API_URL } from ".";
import { Session } from "next-auth";
import { UserGroupsListResponse } from "@/components/groups/groupsHooks";
import { unstable_cache as cache } from "next/cache";
import { signOut } from "../auth";

export const fetchCompanyGroups = cache(
  async (session: Session | null) => {
    if (!session) {
      signOut();
    }

    const apiToken = session?.access_token;

    const data = await fetch(`${BITSWAN_BACKEND_API_URL}/user-groups`, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    });

    return (await data.json()) as UserGroupsListResponse;
  },
  [],
  {
    tags: ["org-groups"],
  },
);
