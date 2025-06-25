"use client";

import React from "react";
import { useMQTT } from "./useMQTT";
import { useQuery } from "@tanstack/react-query";
import { getMQTTConfig } from "@/server/queries/mqtt";
import {
  ACTIVE_MQTT_PROFILE_STORAGE_KEY,
  MQTT_CONFIG_QUERY_KEY,
} from "../constants";
import useLocalStorageState from "ahooks/lib/useLocalStorageState";
import { type MQTTProfile } from "@/server/actions/mqtt-profiles";
import { getMQTTToken } from "@/server/actions/mqtt";
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

  React.useEffect(() => {
    if (activeMQTTProfile && mqttConfig) {
      getMQTTToken(activeMQTTProfile)
        .then((token) => {
          console.log("token", token);
          mqttConnect(mqttConfig.url, {
            clientId:
              "bitswan-poc" + Math.random().toString(16).substring(2, 8),
            clean: true,
            reconnectPeriod: 60,
            connectTimeout: 30 * 1000,
            username: activeMQTTProfile?.id ?? "",
            password: token ?? "",
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
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }, [
    activeMQTTProfile,
    defaultRequest,
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
  const messageTopic = payload?.topic;

  return {
    response,
    isLoading,
    messageTopic,
  };
}
