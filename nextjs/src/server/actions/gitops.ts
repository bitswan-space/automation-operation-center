"use server";

import { BITSWAN_BACKEND_API_URL } from ".";
import { GitopsListResponse } from "@/components/gitops/hooks";
import { Session } from "next-auth";
import { unstable_cache as cache } from "next/cache";
import { signOut } from "../auth";

export const fetchGitopsList = cache(
  async (session: Session | null) => {
    if (!session) {
      signOut();
    }

    const apiToken = session?.access_token;

    const data = await fetch(`${BITSWAN_BACKEND_API_URL}/gitops`, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    });

    return (await data.json()) as GitopsListResponse;
  },
  [],
  {
    tags: ["gitops"],
  },
);
