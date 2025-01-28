"use server";

import axios, { AxiosError } from "axios";

import { BITSWAN_BACKEND_API_URL } from ".";
import { GitopsListResponse } from "@/components/gitops/hooks";
import { auth } from "../auth";

export const fetchGitopsList = async (): Promise<GitopsListResponse> => {
  const session = await auth();

  const apiToken = session?.access_token;

  return axios
    .get<GitopsListResponse>(`${BITSWAN_BACKEND_API_URL}/gitops`, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    })
    .then((response) => response.data)
    .catch((error: AxiosError) => {
      throw error;
    });
};
