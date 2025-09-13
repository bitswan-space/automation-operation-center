"use client";

import React from "react";
import { useMQTT } from "./useMQTT";
import { useQuery } from "@tanstack/react-query";
import { getMQTTConfig } from "@/server/queries/mqtt";
import { MQTT_CONFIG_QUERY_KEY } from "../constants";

type UseMQTTRequestResponseArgs<ResponseT> = {
  requestTopic: string;
  responseTopic: string;
  requestMessage?: string | object;
  infiniteSubscription?: boolean;
  onMessage?: (response: ResponseT) => void;
  tokens: string[];
};

export function useMQTTRequestResponse<ResponseT>({
  requestTopic,
  responseTopic,
  requestMessage,
  // infiniteSubscription = false,
  tokens,
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

  React.useEffect(() => {
    if (mqttConfig) {
      tokens.forEach(token => {
        console.log("token", token);
        mqttConnect(mqttConfig.url, {
          clientId:
            "bitswan-poc" + Math.random().toString(16).substring(2, 8),
          clean: true,
          reconnectPeriod: 60,
          connectTimeout: 30 * 1000,
          username: "bitswan-frontend",
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
      });
    }
  }, [
    tokens,
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
