import axios, { type AxiosError } from "axios";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { BASE_API_URL } from "@/shared/constants";
import { type z } from "zod";
import {
  type UpdateMQTTBrokerSchema,
  type CreateMQTTBrokerSchema,
} from "@/shared/schema/mqtt-brokers";

export type MQTTBroker = {
  name: string;
  url: string;
  username: string;
  id: string;
  active: boolean;
  password: string;
};

type MQTTBrokerListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: MQTTBroker[];
};

type MQTTBrokerCreateResponse = {
  name: string;
  id: string;
  url: string;
};

export const createMQTTBroker = (params: {
  accessToken: string;
  broker: z.infer<typeof CreateMQTTBrokerSchema>;
}): Promise<MQTTBrokerCreateResponse> => {
  return axios
    .post<MQTTBrokerCreateResponse>(
      `${BASE_API_URL}/brokers/`,
      { ...params.broker },
      {
        headers: {
          Authorization: `Bearer ${params.accessToken}`,
        },
      },
    )
    .then((response) => response.data);
};

export const deleteMQTTBroker = (params: {
  apiToken: string;
  id: string;
}): Promise<void> =>
  axios.delete(`${BASE_API_URL}/brokers/${params.id}`, {
    headers: {
      Authorization: `Bearer ${params.apiToken}`,
    },
  });

export const updateMQTTBroker = (params: {
  accessToken: string;
  broker: z.infer<typeof UpdateMQTTBrokerSchema>;
}): Promise<MQTTBroker> => {
  return axios
    .put<MQTTBroker>(
      `${BASE_API_URL}/brokers/${params.broker.id}/`,
      { ...params.broker },
      {
        headers: {
          Authorization: `Bearer ${params.accessToken}`,
        },
      },
    )
    .then((response) => response.data);
};

export const fetchMQTTBrokers = (
  apiToken?: string,
  onSuccess?: (data: MQTTBrokerListResponse) => void,
): Promise<MQTTBrokerListResponse> =>
  axios
    .get<MQTTBrokerListResponse>(`${BASE_API_URL}/brokers`, {
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

type UseMQTTBrokersProps = {
  onSuccess?: (data: MQTTBrokerListResponse) => void;
};

export const useMQTTBrokers = (props?: UseMQTTBrokersProps) => {
  const { onSuccess } = props ?? {};
  const { data: session } = useSession();

  const accessToken = session?.access_token;

  return useQuery({
    queryKey: ["mqtt-brokers", accessToken],
    queryFn: () => fetchMQTTBrokers(accessToken, onSuccess),
    enabled: !!accessToken,
  });
};
