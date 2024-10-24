"use client";

import axios, { type AxiosError } from "axios";

import { useQuery } from "@tanstack/react-query";
import { signIn, useSession } from "next-auth/react";
import { BASE_API_URL } from "@/shared/constants";

type Gitops = {
  name: string;
  id: string;
};

type GitopsCreateResponse = {
  id: string;
  secret_key: string;
  name: string;
};

type GitopsListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Gitops[];
};

export const fetchGitopsList = (
  apiToken?: string,
): Promise<GitopsListResponse> =>
  axios
    .get<GitopsListResponse>(`${BASE_API_URL}/gitops`, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    })
    .then((response) => response.data)
    .catch((error: AxiosError) => {
      if (error.response?.status === 403) {
        console.error("Unauthorized");
        void signIn("keycloak");
      }

      throw error;
    });

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

export const useGitopsList = () => {
  const { data: session } = useSession();

  const encryptedAccessToken = session?.access_token;

  return useQuery({
    queryKey: ["gitops", encryptedAccessToken],
    queryFn: () => fetchGitopsList(encryptedAccessToken),
    enabled: !!encryptedAccessToken,
  });
};
