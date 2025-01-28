"use server";

import axios, { AxiosError } from "axios";

import { BITSWAN_BACKEND_API_URL } from ".";
import { UserGroupsListResponse } from "@/components/groups/groupsHooks";
import { auth } from "../auth";

export const fetchCompanyGroups = async (): Promise<UserGroupsListResponse> => {
  const session = await auth();

  const apiToken = session?.access_token;

  return axios
    .get<UserGroupsListResponse>(`${BITSWAN_BACKEND_API_URL}/user-groups`, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    })
    .then((response) => {
      return response.data;
    })
    .catch((error: AxiosError) => {
      throw error;
    });
};
