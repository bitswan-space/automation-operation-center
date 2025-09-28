"use server";

import { ACTIVE_ORG_COOKIE_NAME } from "@/shared/constants";
import { AppError } from "@/lib/errors";
import { authenticatedActionClient } from "@/lib/safe-action";
import { createOrg } from "@/data/organisations";
import z from "zod";
import { zfd } from "zod-form-data";

export const createOrgAction = async (data: { name: string }) => {
  const org = await createOrg(data.name);
  if ("status" in org && org.status === "error") {
    throw new AppError({
      name: "createOrgAction",
      code: "CREATE_ORG_ERROR",
      message: "Error creating org",
    });
  }

  return org;
};

export const switchOrgAction = async (data: { orgId: string }) => {
  // Set cookie in browser
  document.cookie = `${ACTIVE_ORG_COOKIE_NAME}=${data.orgId}; path=/; max-age=${60 * 60 * 24 * 30}`;

  return { success: true };
};
