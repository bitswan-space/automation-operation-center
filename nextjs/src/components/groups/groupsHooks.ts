import axios, { type AxiosError } from "axios";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { BASE_API_URL, USER_GROUPS_QUERY_KEY } from "@/shared/constants";
import { type CreateGroupFormSchema } from "./CreateGroupFormSheet";
import { type z } from "zod";

type RawUserGroup = {
  name: string;
  id: string;
  attributes: Record<string, string[]>;
};

export type UserGroup = {
  name: string;
  id: string;
  color: string;
  broker: string;
};

export type UserGroupsListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: RawUserGroup[];
};

export const fetchUserGroups = (
  apiToken?: string,
  onSuccess?: (data: UserGroupsListResponse) => void,
): Promise<UserGroupsListResponse> =>
  axios
    .get<UserGroupsListResponse>(`${BASE_API_URL}/user-groups`, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    })
    .then((response) => {
      onSuccess?.(response.data);
      return response.data;
    })
    .catch((error: AxiosError) => {
      throw error;
    });

export const useUserGroups = () => {
  const { data: session } = useSession();

  const accessToken = session?.access_token;

  return useQuery({
    queryKey: [USER_GROUPS_QUERY_KEY, accessToken],
    queryFn: () => fetchUserGroups(accessToken),
    enabled: !!accessToken,
  });
};

export const createUserGroup = (params: {
  accessToken: string;
  userGroup: z.infer<typeof CreateGroupFormSchema>;
}): Promise<RawUserGroup> => {
  return axios
    .post<RawUserGroup>(
      `${BASE_API_URL}/user-groups/`,
      { ...params.userGroup },
      {
        headers: {
          Authorization: `Bearer ${params.accessToken}`,
        },
      },
    )
    .then((response) => response.data);
};

export const deleteUserGroup = (params: {
  apiToken: string;
  id: string;
}): Promise<void> =>
  axios.delete(`${BASE_API_URL}/user-groups/${params.id}`, {
    headers: {
      Authorization: `Bearer ${params.apiToken}`,
    },
  });

export const updateUserGroup = (params: {
  accessToken: string;
  id: string;
  userGroup: z.infer<typeof CreateGroupFormSchema>;
}): Promise<RawUserGroup> => {
  return axios
    .put<RawUserGroup>(
      `${BASE_API_URL}/user-groups/${params.id}/`,
      { ...params.userGroup },
      {
        headers: {
          Authorization: `Bearer ${params.accessToken}`,
        },
      },
    )
    .then((response) => response.data);
};
