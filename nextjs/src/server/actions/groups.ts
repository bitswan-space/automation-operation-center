"use server";

import { type ActionState, BITSWAN_BACKEND_API_URL } from "./shared";
import { auth, signOut } from "../auth";
import { unstable_cache as cache, revalidateTag } from "next/cache";

import { type Session } from "next-auth";
import { z } from "zod";
import { zJsonString } from "@/lib/zod";
import { zfd } from "zod-form-data";

const ORG_GROUPS_CACHE_KEY = "org-groups";

export type UserGroup = {
  name: string;
  id: string;
  tag_color: string;
  description: string;
  active: boolean;
};
export type UserGroupsListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: UserGroup[];
};

export const fetchOrgGroups = cache(async (session: Session | null) => {
  if (!session) {
    await signOut();
  }

  const apiToken = session?.access_token;

  const data = await fetch(`${BITSWAN_BACKEND_API_URL}/user-groups`, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  });

  return (await data.json()) as UserGroupsListResponse;
});

const deleteOrgGroup = async (id: string) => {
  const session = await auth();

  const apiToken = session?.access_token;

  return fetch(`${BITSWAN_BACKEND_API_URL}/user-groups/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  });
};

const addUserToGroup = async (userId: string, groupId: string) => {
  const session = await auth();

  const apiToken = session?.access_token;

  return fetch(
    `${BITSWAN_BACKEND_API_URL}/user-groups/${groupId}/add_member/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
      }),
    },
  );
};

const removeUserFromGroup = async (userId: string, groupId: string) => {
  const session = await auth();

  const apiToken = session?.access_token;

  return fetch(
    `${BITSWAN_BACKEND_API_URL}/user-groups/${groupId}/remove_member/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
      }),
    },
  );
};

const CreateOrUpdateGroupFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, {
    message: "Group name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  tag_color: z.string().optional(),
  nav_items: zJsonString.optional(),
});

export type CreateOrUpdateOrgGroupFormActionState = ActionState<
  z.infer<typeof CreateOrUpdateGroupFormSchema>
>;

const DeleteOrgGroupFormSchema = z.object({
  id: z.string(),
});

export type DeleteOrgGroupFormActionState = ActionState<
  z.infer<typeof DeleteOrgGroupFormSchema>
>;

export const deleteOrgGroupAction = async (
  state: DeleteOrgGroupFormActionState,
  formData: FormData,
): Promise<DeleteOrgGroupFormActionState> => {
  const validatedFields = await DeleteOrgGroupFormSchema.safeParseAsync({
    id: formData.get("id") as string,
  });

  if (!validatedFields.success) {
    return {
      status: "error",
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Error deleting group",
    };
  }

  const id = validatedFields.data.id;

  const res = await deleteOrgGroup(id);

  if (!res.ok) {
    return {
      status: "error",
      message: "Error deleting group",
    };
  }

  revalidateTag(ORG_GROUPS_CACHE_KEY);

  return {
    data: {
      id,
    },
    message: "Group deleted",
    status: "success",
  };
};

const AddMemberToGroupSchema = z.object({
  userId: z.string().min(1),
  groupId: z.string().min(1),
});

export type AddMemberToGroupFormActionState = ActionState<
  z.infer<typeof AddMemberToGroupSchema>
>;

export const addMemberToGroupAction = async (
  state: AddMemberToGroupFormActionState,
  formData: FormData,
): Promise<AddMemberToGroupFormActionState> => {
  const validatedFields = await AddMemberToGroupSchema.safeParseAsync({
    userId: formData.get("userId") as string,
    groupId: formData.get("groupId") as string,
  });

  if (!validatedFields.success) {
    return {
      status: "error",
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Error adding user to group",
    };
  }

  const userId = validatedFields.data.userId;
  const groupId = validatedFields.data.groupId;

  const res = await addUserToGroup(userId, groupId);

  if (!res.ok) {
    return {
      status: "error",
      message: "Error adding user to group",
    };
  }

  revalidateTag(ORG_GROUPS_CACHE_KEY);

  return {
    data: {
      userId,
      groupId,
    },
    message: "User added to group",
    status: "success",
  };
};

const RemoveMemberFromGroupSchema = z.object({
  userId: z.string().min(1),
  groupId: z.string().min(1),
});

export type RemoveMemberFromGroupFormActionState = ActionState<
  z.infer<typeof RemoveMemberFromGroupSchema>
>;

export const removeMemberFromGroupAction = async (
  state: RemoveMemberFromGroupFormActionState,
  formData: FormData,
): Promise<RemoveMemberFromGroupFormActionState> => {
  const validatedFields = await RemoveMemberFromGroupSchema.safeParseAsync({
    userId: formData.get("userId") as string,
    groupId: formData.get("groupId") as string,
  });

  if (!validatedFields.success) {
    return {
      status: "error",
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Error removing user from group",
    };
  }

  const userId = validatedFields.data.userId;
  const groupId = validatedFields.data.groupId;

  const res = await removeUserFromGroup(userId, groupId);

  if (!res.ok) {
    return {
      status: "error",
      message: "Error removing user from group",
    };
  }

  revalidateTag(ORG_GROUPS_CACHE_KEY);

  return {
    data: {
      userId,
      groupId,
    },
    message: "User removed from group",
    status: "success",
  };
};
