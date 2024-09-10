import { isError, useQuery } from "@tanstack/react-query";

import React from "react";
import { getMQTTConfig } from "@/server/queries/mqtt";
import { useMQTT } from "./useMQTT";

interface MQTTConfig {
  url: string;
}

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
  onMessage, // infiniteSubscription = false,
}: UseMQTTRequestResponseArgs<ResponseT>) {
  const { mqttConnect, mqttSub, payload, mqttPublish } = useMQTT<
    ResponseT & { remaining_subscription_count?: number }
  >();

  const [isLoading, setIsLoading] = React.useState(true);
  const [response, setResponse] = React.useState<ResponseT | null>(null);
  const [error, setError] = React.useState<Error | null>(null);

  // Use refs to store stable references to functions
  const mqttConnectRef = React.useRef(mqttConnect);
  const mqttSubRef = React.useRef(mqttSub);
  const mqttPublishRef = React.useRef(mqttPublish);
  const onMessageRef = React.useRef(onMessage);

  useQuery<MQTTConfig>({
    queryKey: ["mqttConfig"],
    queryFn: getMQTTConfig,
    onSuccess: (mqttConfig) => {
      mqttConnectRef.current(mqttConfig.url, {
        clientId: "bitswan-poc" + Math.random().toString(16).substring(2, 8),
        clean: true,
        reconnectPeriod: 1000,
        connectTimeout: 30 * 1000,
        username: "test",
        password: "randompassword",
      });

      const req = { count: 1 };

      mqttPublishRef.current({
        topic: requestTopic,
        payload: JSON.stringify(requestMessage) ?? JSON.stringify(req),
        qos: 0,
      });

      mqttSubRef.current({
        topic: responseTopic,
        qos: 0,
      });
    },
  });

  React.useEffect(() => {
    if (payload) {
      setIsLoading(false);
      try {
        const parsedPayload = payload.message;
        setResponse(parsedPayload);
        onMessageRef.current?.(parsedPayload);
      } catch (err) {
        setError(new Error("Failed to parse payload"));
        setIsLoading(false);
      }
    }
  }, [payload]);

  return {
    response,
    isLoading,
    error,
  };
}
