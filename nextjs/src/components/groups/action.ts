"use server";

import { AppError } from "@/lib/errors";
import { CreateOrUpdateOrgGroupFormDataSchema } from "./schema";
import { type NavItem } from "../layout/Sidebar/utils/NavItems";
import { authenticatedActionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  addUserToGroup,
  deleteOrgGroup,
  removeUserFromGroup,
  updateOrgGroup,
  createOrgGroup,
} from "@/data/groups";
import { zfd } from "zod-form-data";

export const createOrUpdateOrgGroupAction = authenticatedActionClient
  .metadata({
    actionName: "createOrUpdateOrgGroupAction",
  })
  .inputSchema(CreateOrUpdateOrgGroupFormDataSchema)
  .action(
    async ({
      parsedInput: { id, name, description, tag_color, nav_items },
    }) => {
      if (id) {
        const navItems = nav_items
          ? (JSON.parse(nav_items) as NavItem[])
          : undefined;
        const res = await updateOrgGroup({
          id,
          name,
          description,
          tag_color,
          nav_items: navItems,
        });
        if (res.status === "error") {
          throw new AppError({
            name: "UpdateGroupError",
            message: `Error updating group`,
            code: "UPDATE_GROUP_ERROR",
          });
        }

        revalidatePath("/dashboard/settings");
        return {
          message: "Group updated",
          status: "success",
          data: {
            name,
            description,
            tag_color,
            nav_items,
          },
        };
      }

      const res = await createOrgGroup({
        name,
        description,
        tag_color,
        nav_items,
      });
      if (res.status === "error") {
        throw new AppError({
          name: "CreateGroupError",
          message: "Error creating group",
          code: "CREATE_GROUP_ERROR",
        });
      }

      revalidatePath("/dashboard/settings");
      return {
        message: "Group created",
        status: "success",
        data: {
          name,
          description,
          tag_color,
          nav_items,
        },
      };
    },
  );

export const deleteOrgGroupAction = authenticatedActionClient
  .metadata({
    actionName: "deleteOrgGroupAction",
  })
  .inputSchema(
    zfd.formData({
      id: z.string(),
    }),
  )
  .action(async ({ parsedInput: { id } }) => {
    const res = await deleteOrgGroup(id);
    if (res.status === "error") {
      throw new AppError({
        name: "DeleteGroupError",
        message: "Error deleting group",
        code: "DELETE_GROUP_ERROR",
      });
    }

    revalidatePath("/dashboard/settings");
    return {
      message: "Group deleted",
      status: "success",
    };
  });

export const addUserToGroupAction = authenticatedActionClient
  .metadata({
    actionName: "addUserToGroupAction",
  })
  .inputSchema(
    zfd.formData({
      userId: z.string(),
      groupId: z.string(),
    }),
  )
  .action(async ({ parsedInput: { userId, groupId } }) => {
    const res = await addUserToGroup(userId, groupId);
    if (res.status === "error") {
      throw new AppError({
        name: "AddUserToGroupError",
        message: "Error adding user to group",
        code: "ADD_USER_TO_GROUP_ERROR",
      });
    }

    revalidatePath("/dashboard/settings");
    return {
      message: "User added to group",
      status: "success",
    };
  });

export const removeUserFromGroupAction = authenticatedActionClient
  .metadata({
    actionName: "removeUserFromGroupAction",
  })
  .inputSchema(
    zfd.formData({
      userId: z.string(),
      groupId: z.string(),
    }),
  )
  .action(async ({ parsedInput: { userId, groupId } }) => {
    const res = await removeUserFromGroup(userId, groupId);
    if (res.status === "error") {
      throw new AppError({
        name: "RemoveUserFromGroupError",
        message: "Error removing user from group",
        code: "REMOVE_USER_FROM_GROUP_ERROR",
      });
    }

    revalidatePath("/dashboard/settings");
    return {
      message: "User removed from group",
      status: "success",
    };
  });
