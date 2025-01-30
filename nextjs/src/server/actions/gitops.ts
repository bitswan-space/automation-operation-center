"use server";

import { ActionState, BITSWAN_BACKEND_API_URL } from "./shared";

import { GitopsListResponse } from "@/components/gitops/hooks";
import { Session } from "next-auth";
import { unstable_cache as cache } from "next/cache";
import { signOut } from "../auth";
import { z } from "zod";

const GITOPS_CACHE_KEY = "gitops";

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
    tags: [GITOPS_CACHE_KEY],
  },
);

const CreateGitopsSchema = z.object({
  gitopsName: z.string().min(2, {
    message: "GitopsName must be at least 2 characters.",
  }),
});

type CreateGitopsActionState = ActionState<z.infer<typeof CreateGitopsSchema>>;

export const createGitopsAction = async (
  state: CreateGitopsActionState,
  formData: FormData,
): Promise<void> => {};
