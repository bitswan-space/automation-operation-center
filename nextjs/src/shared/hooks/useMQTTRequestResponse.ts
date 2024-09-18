import React from "react";
import { useActiveMQTTBroker } from "@/context/MQTTBrokerProvider";
import { useMQTT } from "./useMQTT";

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

  React.useEffect(() => {
    console.log("useffect", activeMQTTBroker);
    if (activeMQTTBroker) {
      mqttConnect(activeMQTTBroker.url, {
        clientId: "bitswan-poc" + Math.random().toString(16).substring(2, 8),
        clean: true,
        reconnectPeriod: 1000,
        connectTimeout: 30 * 1000,
        username: "test",
        password: "randompassword",
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
