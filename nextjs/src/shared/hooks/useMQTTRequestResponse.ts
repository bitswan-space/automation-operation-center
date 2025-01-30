"use client";

import React from "react";
import { useMQTT } from "./useMQTT";
import { useQuery } from "@tanstack/react-query";
import { type EMQXJWTResponse } from "@/pages/api/mqtt/jwt";
import { getMQTTConfig } from "@/server/queries/mqtt";
import {
  ACTIVE_MQTT_PROFILE_STORAGE_KEY,
  MQTT_CONFIG_QUERY_KEY,
} from "../constants";
import useLocalStorageState from "ahooks/lib/useLocalStorageState";
import { MQTTProfile } from "@/server/actions/mqtt-profiles";

type UseMQTTRequestResponseArgs<ResponseT> = {
  requestTopic: string;
  responseTopic: string;
  requestMessage?: string | object;
  infiniteSubscription?: boolean;
  onMessage?: (response: ResponseT) => void;
};

export function useMQTTRequestResponse<ResponseT>({
  requestTopic,
  responseTopic,
  requestMessage,
  // infiniteSubscription = false,
}: UseMQTTRequestResponseArgs<ResponseT>) {
  const { mqttConnect, mqttSub, payload, mqttPublish } = useMQTT<
    ResponseT & { remaining_subscription_count?: number }
  >();

  const defaultRequest = React.useMemo(() => {
    return { count: 1 };
  }, []);

  const { data: mqttConfig } = useQuery({
    queryKey: [MQTT_CONFIG_QUERY_KEY],
    queryFn: getMQTTConfig,
  });

  const [activeMQTTProfile] = useLocalStorageState<MQTTProfile | undefined>(
    ACTIVE_MQTT_PROFILE_STORAGE_KEY,
    {
      listenStorageChange: true,
    },
  );

  const { data: jwtToken } = useQuery({
    queryKey: ["jwt", activeMQTTProfile],
    enabled: !!activeMQTTProfile,
    queryFn: async () => {
      const response = await fetch("/api/mqtt/jwt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: activeMQTTProfile ?? "",
        }),
      });
      const data = (await response.json()) as EMQXJWTResponse;
      return data.token;
    },
  });

  React.useEffect(() => {
    if (activeMQTTProfile && jwtToken && mqttConfig) {
      mqttConnect(mqttConfig.url, {
        clientId: "bitswan-poc" + Math.random().toString(16).substring(2, 8),
        clean: true,
        reconnectPeriod: 100000,
        connectTimeout: 30 * 1000,
        username: activeMQTTProfile?.id ?? "",
        password: jwtToken,
      });

      mqttPublish({
        topic: requestTopic,
        payload:
          JSON.stringify(requestMessage) ?? JSON.stringify(defaultRequest),
        qos: 0,
      });

      mqttSub({
        topic: responseTopic,
        qos: 0,
      });
    }
  }, [
    activeMQTTProfile,
    defaultRequest,
    jwtToken,
    mqttConfig,
    mqttConnect,
    mqttPublish,
    mqttSub,
    requestMessage,
    requestTopic,
    responseTopic,
  ]);

  const isLoading = !payload;
  const response = payload?.message;

  return {
    response,
    isLoading,
  };
}
