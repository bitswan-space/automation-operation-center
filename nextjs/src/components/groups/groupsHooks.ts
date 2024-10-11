import axios, { type AxiosError } from "axios";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  BASE_API_URL,
  MQTT_PROFILE_QUERY_KEY,
  USER_GROUPS_QUERY_KEY,
} from "@/shared/constants";
import { type CreateGroupFormSchema } from "./CreateGroupFormSheet";
import { type z } from "zod";

export type UserGroup = {
  name: string;
  id: string;
  tag_color: string;
  description: string;
  active: boolean;
};

export type UserGroupsListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: UserGroup[];
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
}): Promise<UserGroup> => {
  return axios
    .post<UserGroup>(
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
  userGroup: {
    name?: string;
    description?: string;
    tag_color?: string;
    active?: boolean;
  };
}): Promise<UserGroup> => {
  return axios
    .put<UserGroup>(
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

export const addMemberToGroup = (params: {
  accessToken: string;
  groupId: string;
  userId: string;
}): Promise<UserGroup> => {
  return axios
    .post<UserGroup>(
      `${BASE_API_URL}/user-groups/${params.groupId}/add_member/`,
      { user_id: params.userId },
      {
        headers: {
          Authorization: `Bearer ${params.accessToken}`,
        },
      },
    )
    .then((response) => response.data);
};

export const removeMemberFromGroup = (params: {
  accessToken: string;
  groupId: string;
  userId: string;
}) => {
  return axios
    .post(
      `${BASE_API_URL}/user-groups/${params.groupId}/remove_member/`,
      { user_id: params.userId },
      {
        headers: {
          Authorization: `Bearer ${params.accessToken}`,
        },
      },
    )
    .then();
};

type MQTTProfile = {
  id: string;
  name: string;
  isAdmin: string;
};

type MQTTProfileListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: MQTTProfile[];
};

export const fetchMQTTProfileList = (
  apiToken?: string,
  onSuccess?: (data: MQTTProfileListResponse) => void,
): Promise<MQTTProfileListResponse> =>
  axios
    .get<MQTTProfileListResponse>(`${BASE_API_URL}/user-groups/mqtt_profiles`, {
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

export const useMQTTProfileList = () => {
  const { data: session } = useSession();

  const accessToken = session?.access_token;

  return useQuery({
    queryKey: [MQTT_PROFILE_QUERY_KEY, accessToken],
    queryFn: () => fetchMQTTProfileList(accessToken),
    enabled: !!accessToken,
  });
};
