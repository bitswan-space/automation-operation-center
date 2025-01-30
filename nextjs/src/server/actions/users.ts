"use server";

import { ActionState, BITSWAN_BACKEND_API_URL } from "./shared";
import { auth, signOut } from "../auth";
import { unstable_cache as cache, revalidateTag } from "next/cache";

import { Session } from "next-auth";
import { UserGroup } from "./groups";
import { z } from "zod";

export type OrgUser = {
  name: string;
  id: string;
  email: string;
  verified: boolean;
  groups: UserGroup[];
};

export type OrgUsersListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: OrgUser[];
};

const USERS_CACHE_KEY = "org-users";

export const fetchOrgUsers = cache(
  async (session: Session | null) => {
    if (!session) {
      signOut();
    }

    const apiToken = session?.access_token;

    const data = await fetch(`${BITSWAN_BACKEND_API_URL}/org-users`, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    });

    return (await data.json()) as OrgUsersListResponse;
  },
  [],
  {
    tags: [USERS_CACHE_KEY],
  },
);

export const inviteUser = async (email: string) => {
  const session = await auth();

  const apiToken = session?.access_token;

  fetch(`${BITSWAN_BACKEND_API_URL}/org-users/invite/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({
      email: email,
    }),
  });
};

const deleteUser = async (id: string) => {
  const session = await auth();

  const apiToken = session?.access_token;

  fetch(`${BITSWAN_BACKEND_API_URL}/org-users/${id}/`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  });
};

const UserInviteFormSchema = z.object({
  email: z.string().email(),
});

export type UserInviteFormActionState = ActionState<{ email: string }>;

export const inviteUserAction = async (
  state: UserInviteFormActionState,
  formData: FormData,
): Promise<UserInviteFormActionState> => {
  const validatedFields = await UserInviteFormSchema.safeParseAsync({
    email: formData.get("email") as string,
  });

  if (!validatedFields.success) {
    return {
      status: "error",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const email = validatedFields.data.email;

  inviteUser(email).catch((error) => {
    console.error("Error inviting user", error);
    return {
      status: "error",
      errors: {
        email: [(error as Error).message],
      },
    };
  });

  revalidateTag(USERS_CACHE_KEY);

  return {
    status: "success",
    data: {
      email: email,
    },
    message: "User invited",
  };
};

export type DeleteUserActionState = ActionState<{ id: string }>;

export const deleteUserAction = async (
  state: DeleteUserActionState,
  formData: FormData,
): Promise<DeleteUserActionState> => {
  const validatedFields = await z
    .object({
      id: z.string(),
    })
    .safeParseAsync({
      id: formData.get("id") as string,
    });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Error deleting user",
      status: "error",
    };
  }

  const id = validatedFields.data.id;

  deleteUser(id).catch((error) => {
    console.error("Error deleting user", error);
    return {
      errors: {
        id: [(error as Error).message],
        message: "Error deleting user",
        status: "error",
      },
    };
  });

  revalidateTag(USERS_CACHE_KEY);

  return {
    data: {
      id: id,
    },
    message: "User deleted",
    status: "success",
  };
};
