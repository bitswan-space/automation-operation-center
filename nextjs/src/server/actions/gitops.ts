"use server";

import { type ActionState, BITSWAN_BACKEND_API_URL } from "./shared";
import { auth, signOut } from "../auth";
import { unstable_cache as cache, revalidateTag } from "next/cache";

import { type Session } from "next-auth";
import { z } from "zod";

const GITOPS_CACHE_KEY = "gitops";

export type Gitops = {
  name: string;
  id: string;
};
export type GitopsCreateResponse = {
  id: string;
  secret_key: string;
  name: string;
};
export type GitopsListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Gitops[];
};

export const fetchGitopsList = cache(
  async (session: Session | null) => {
    if (!session) {
      await signOut();
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

export const createGitops = async (
  params: z.infer<typeof CreateGitopsSchema>,
) => {
  const session = await auth();

  const apiToken = session?.access_token;

  return fetch(`${BITSWAN_BACKEND_API_URL}/gitops`, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(params),
  });
};

const updateGitops = async (params: z.infer<typeof CreateGitopsSchema>) => {
  const session = await auth();

  const apiToken = session?.access_token;

  return fetch(`${BITSWAN_BACKEND_API_URL}/gitops/${params.id}`, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    method: "PUT",
    body: JSON.stringify(params),
  });
};

const deleteGitops = async (id: string) => {
  const session = await auth();

  const apiToken = session?.access_token;

  return fetch(`${BITSWAN_BACKEND_API_URL}/gitops/${id}`, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
    method: "DELETE",
  });
};

const CreateGitopsSchema = z.object({
  name: z.string().min(2, {
    message: "GitopsName must be at least 2 characters.",
  }),
  id: z.string().optional(),
  result: z
    .object({
      secret_key: z.string(),
    })
    .optional(),
});

export type CreateGitopsActionState = ActionState<
  z.infer<typeof CreateGitopsSchema>
>;

export const createGitopsAction = async (
  state: CreateGitopsActionState,
  formData: FormData,
): Promise<CreateGitopsActionState> => {
  const validatedFields = await CreateGitopsSchema.safeParseAsync({
    name: formData.get("gitopsName") as string,
    id: formData.get("id") as string,
  });

  if (!validatedFields.success) {
    return {
      status: "error",
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Error creating gitops",
    };
  }

  const name = validatedFields.data.name;
  const id = validatedFields.data.id;

  if (validatedFields.data.id) {
    const res = await updateGitops({
      id,
      name,
    });

    if (!res.ok) {
      return {
        status: "error",
        message: "Error updating group",
      };
    }

    revalidateTag(GITOPS_CACHE_KEY);

    return {
      data: {
        name,
        id,
      },
      message: "Group updated",
      status: "success",
    };
  }

  const res = await createGitops({ name });

  if (!res.ok) {
    return {
      status: "error",
      message: "Error creating gitops",
    };
  }

  revalidateTag(GITOPS_CACHE_KEY);

  const data = (await res.json()) as GitopsCreateResponse;

  return {
    data: {
      name,
      result: {
        secret_key: data.secret_key,
      },
    },
    message: "Gitops created",
    status: "success",
  };
};

const DeleteGitopsFormSchema = z.object({
  id: z.string(),
});

export type DeleteGitopsActionState = ActionState<
  z.infer<typeof DeleteGitopsFormSchema>
>;

export const deleteGitopsAction = async (
  state: DeleteGitopsActionState,
  formData: FormData,
): Promise<DeleteGitopsActionState> => {
  const validatedFields = await DeleteGitopsFormSchema.safeParseAsync({
    id: formData.get("id") as string,
  });

  if (!validatedFields.success) {
    return {
      status: "error",
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Error deleting gitops",
    };
  }

  const id = validatedFields.data.id;

  const res = await deleteGitops(id);

  if (!res.ok) {
    return {
      status: "error",
      message: "Error deleting gitops",
    };
  }

  revalidateTag(GITOPS_CACHE_KEY);

  return {
    message: "Gitops deleted",
    status: "success",
  };
};
