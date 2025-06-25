"use server";

import { AppError } from "@/lib/errors";
import { BITSWAN_BACKEND_API_URL } from "@/server/actions/shared";
import { CreateOrUpdateOrgGroupFormDataSchema } from "./schema";
import { NavItem } from "../layout/Sidebar/utils/NavItems";
import { auth } from "@/server/auth";
import { authenticatedActionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";

const createOrgGroup = async (userGroup: {
  name: string;
  description?: string;
  tag_color?: string;
  nav_items?: string;
}) => {
  console.log("createOrgGroup", userGroup);

  const session = await auth();

  const apiToken = session?.access_token;

  return fetch(`${BITSWAN_BACKEND_API_URL}/user-groups/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...userGroup,
    }),
  });
};

const updateOrgGroup = async (userGroup: {
  id: string;
  name?: string;
  description?: string;
  tag_color?: string;
  nav_items?: NavItem[];
}) => {
  console.log("updateOrgGroup", userGroup);

  const session = await auth();

  const apiToken = session?.access_token;

  return fetch(`${BITSWAN_BACKEND_API_URL}/user-groups/${userGroup.id}/`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...userGroup,
    }),
  });
};

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
        console.log("update org group res:", await res.text());

        if (!res.ok) {
          const errorText = await res.text();
          throw new AppError({
            name: "UpdateGroupError",
            message: `Error updating group: ${errorText}`,
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
      const errorText = await res.text();
      console.error("create org group res:", errorText);
      if (!res.ok) {
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
