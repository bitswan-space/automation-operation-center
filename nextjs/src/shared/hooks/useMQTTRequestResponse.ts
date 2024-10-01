import React from "react";
import { useActiveMQTTBroker } from "@/context/MQTTBrokerProvider";
import { useMQTT } from "./useMQTT";
import { useQuery } from "@tanstack/react-query";
import { type EMQXJWTResponse } from "@/pages/api/mqtt-jwt";

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
  requestMessage, // infiniteSubscription = false,
}: UseMQTTRequestResponseArgs<ResponseT>) {
  const { mqttConnect, mqttSub, payload, mqttPublish } = useMQTT<
    ResponseT & { remaining_subscription_count?: number }
  >();

  const activeMQTTBroker = useActiveMQTTBroker();

  const defaultRequest = React.useMemo(() => {
    return { count: 1 };
  }, []);

  const { data: jwtToken } = useQuery({
    queryKey: ["jwt", activeMQTTBroker?.username],
    enabled: !!activeMQTTBroker,
    queryFn: async () => {
      const response = await fetch("/api/mqtt-jwt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: activeMQTTBroker?.username ?? "",
        }),
      });
      const data = (await response.json()) as EMQXJWTResponse;
      return data.token;
    },
  });

  React.useEffect(() => {
    if (activeMQTTBroker && jwtToken) {
      mqttConnect(activeMQTTBroker.url, {
        clientId: "bitswan-poc" + Math.random().toString(16).substring(2, 8),
        clean: true,
        reconnectPeriod: 1000,
        connectTimeout: 30 * 1000,
        username: activeMQTTBroker?.username ?? "",
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
    activeMQTTBroker,
    defaultRequest,
    jwtToken,
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
