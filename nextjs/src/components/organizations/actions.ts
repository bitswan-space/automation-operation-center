"use server";

import { ACTIVE_ORG_COOKIE_NAME } from "@/shared/constants";
import { AppError } from "@/lib/errors";
import { authenticatedActionClient } from "@/lib/safe-action";
import { cookies } from "next/headers";
import { createOrg } from "@/data/organisations";
import { revalidatePath } from "next/cache";
import z from "zod";
import { zfd } from "zod-form-data";

export const createOrgAction = authenticatedActionClient
  .metadata({
    actionName: "createOrgAction",
  })
  .inputSchema(
    zfd.formData({
      name: z.string(),
    }),
  )
  .action(async ({ parsedInput: { name } }) => {
    const org = await createOrg(name);
    if ("status" in org && org.status === "error") {
      throw new AppError({
        name: "createOrgAction",
        code: "CREATE_ORG_ERROR",
        message: "Error creating org",
      });
    }

    revalidatePath("/", "layout");
    return org;
  });

export const switchOrgAction = authenticatedActionClient
  .metadata({
    actionName: "switchOrgAction",
  })
  .inputSchema(zfd.formData({ orgId: z.string() }))
  .action(async ({ parsedInput: { orgId } }) => {
    const cookieStore = await cookies();

    cookieStore.set(ACTIVE_ORG_COOKIE_NAME, orgId, {
      httpOnly: false,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
    });

    revalidatePath("/", "layout");

    return { success: true };
  });
