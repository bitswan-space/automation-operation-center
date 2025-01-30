"use client";

import { BASE_API_URL } from "@/shared/constants";
import axios from "axios";

type Gitops = {
  name: string;
  id: string;
};

type GitopsCreateResponse = {
  id: string;
  secret_key: string;
  name: string;
};

export type GitopsListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Gitops[];
};

export const createGitops = (params: {
  apiToken: string;
  name: string;
}): Promise<GitopsCreateResponse> => {
  return axios
    .post<GitopsCreateResponse>(
      `${BASE_API_URL}/gitops/`,
      { name: params.name },
      {
        headers: {
          Authorization: `Bearer ${params.apiToken}`,
        },
      },
    )
    .then((response) => response.data);
};

export const updateGitops = (params: {
  apiToken: string;
  id: string;
  name: string;
}): Promise<Gitops> =>
  axios
    .put<Gitops>(
      `${BASE_API_URL}/gitops/${params.id}/`,
      { name: params.name },
      {
        headers: {
          Authorization: `Bearer ${params.apiToken}`,
        },
      },
    )
    .then((response) => response.data);

export const deleteGitops = (params: {
  apiToken: string;
  id: string;
}): Promise<void> =>
  axios.delete(`${BASE_API_URL}/gitops/${params.id}`, {
    headers: {
      Authorization: `Bearer ${params.apiToken}`,
    },
  });
