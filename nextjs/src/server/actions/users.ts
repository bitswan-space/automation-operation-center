"use server";

import axios, { AxiosError } from "axios";

import { BITSWAN_BACKEND_API_URL } from ".";
import { OrgUsersListResponse } from "@/components/users/usersHooks";
import { auth } from "../auth";

export const fetchOrgUsers = async (): Promise<OrgUsersListResponse> => {
  const session = await auth();

  const apiToken = session?.access_token;

  return axios
    .get<OrgUsersListResponse>(`${BITSWAN_BACKEND_API_URL}/org-users`, {
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
