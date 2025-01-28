"use server";

import { auth, signOut } from "../auth";

import { BITSWAN_BACKEND_API_URL } from ".";
import { Session } from "next-auth";
import { UserGroup } from "@/components/groups/groupsHooks";
import { unstable_cache as cache } from "next/cache";
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
    tags: ["org-users"],
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

const UserInviteFormSchema = z.object({
  email: z.string().email(),
});

export type UserInviteFormActionState = {
  errors?: { email?: string[] };
  message?: string;
  data?: { email: string };
  status?: "success" | "error";
};

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

  return {
    status: "success",
    data: {
      email: email,
    },
    message: "User invited",
  };
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

export type DeleteUserActionState = {
  errors?: { id?: string[] };
  message?: string;
  data?: { id: string };
};

export const deleteUserAction = async (
  state: DeleteUserActionState,
  formData: FormData,
) => {
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
    };
  }

  const id = validatedFields.data.id;

  deleteUser(id).catch((error) => {
    console.error("Error deleting user", error);
    return {
      errors: {
        id: [(error as Error).message],
      },
    };
  });

  return {
    data: {
      id: id,
    },
    message: "User deleted",
  };
};
