import { BASE_API_URL, ORG_USERS_QUERY_KEY } from "@/shared/constants";
import { useQuery } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import { useSession } from "next-auth/react";
import { type UserGroup } from "../groups/groupsHooks";

export type OrgUser = {
  name: string;
  id: string;
  email: string;
  verified: boolean;
  groups: UserGroup[];
};

export type OrgUsersListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: OrgUser[];
};

export const fetchOrgUsers = (
  apiToken?: string,
  onSuccess?: (data: OrgUsersListResponse) => void,
): Promise<OrgUsersListResponse> =>
  axios
    .get<OrgUsersListResponse>(`${BASE_API_URL}/org-users`, {
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

export const useOrgUsers = () => {
  const { data: session } = useSession();

  const accessToken = session?.access_token;

  return useQuery({
    queryKey: [ORG_USERS_QUERY_KEY, accessToken],
    queryFn: () => fetchOrgUsers(accessToken),
    enabled: !!accessToken,
  });
};

export const inviteUser = (params: { accessToken: string; email: string }) => {
  return axios
    .post(
      `${BASE_API_URL}/org-users/invite/`,
      { email: params.email },
      {
        headers: {
          Authorization: `Bearer ${params.accessToken}`,
        },
      },
    )
    .then();
};

export const deleteUser = (params: {
  apiToken: string;
  id: string;
}): Promise<void> =>
  axios.delete(`${BASE_API_URL}/org-users/${params.id}`, {
    headers: {
      Authorization: `Bearer ${params.apiToken}`,
    },
  });
