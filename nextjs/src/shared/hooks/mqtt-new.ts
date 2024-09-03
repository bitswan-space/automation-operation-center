import React from "react";
import { getMQTTConfig } from "@/server/queries/mqtt";
import { useMQTT } from "@/lib/mqtt-new";
import { useQuery } from "@tanstack/react-query";

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
  onMessage,
  infiniteSubscription = false,
}: UseMQTTRequestResponseArgs<ResponseT>) {
  const [response, setResponse] = React.useState<
    | (ResponseT & {
        remaining_subscription_count?: number;
      })
    | null
  >(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const mqttQuery = useQuery<MQTTConfig>({
    queryKey: ["mqttConfig"],
    queryFn: getMQTTConfig,
  });

  const { mqttConnect, mqttSub, payload, mqttPublish, client } = useMQTT<
    ResponseT & { remaining_subscription_count?: number }
  >();

  // Use refs to store stable references to functions
  const mqttConnectRef = React.useRef(mqttConnect);
  const mqttSubRef = React.useRef(mqttSub);
  const mqttPublishRef = React.useRef(mqttPublish);

  // Update refs when functions change
  React.useEffect(() => {
    mqttConnectRef.current = mqttConnect;
    mqttSubRef.current = mqttSub;
    mqttPublishRef.current = mqttPublish;
  }, [mqttConnect, mqttSub, mqttPublish]);

  React.useEffect(() => {
    if (mqttQuery.data) {
      mqttConnectRef.current(mqttQuery.data.url, {
        clientId: "bitswan-poc" + Math.random().toString(16).substring(2, 8),
        clean: true,
        reconnectPeriod: 1000,
        connectTimeout: 30 * 1000,
        username: "test",
        password: "randompassword",
      });
    }
  }, [mqttQuery.data]);

  const onMessageCallback = React.useCallback(
    (response: ResponseT) => {
      onMessage?.(response);
    },
    [onMessage],
  );

  React.useEffect(() => {
    if (payload) {
      try {
        const parsedPayload = payload.message;
        setResponse(parsedPayload);
        setIsLoading(false);
        onMessageCallback(parsedPayload);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to parse payload"),
        );
        setIsLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload]);

  // Subscribe and publish
  React.useEffect(() => {
    if (client) {
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

      if (
        infiniteSubscription &&
        response?.remaining_subscription_count &&
        response?.remaining_subscription_count <= 1
      ) {
        mqttPublishRef.current({
          topic: requestTopic,
          payload: JSON.stringify(requestMessage) ?? JSON.stringify(req),
          qos: 0,
        });
      }
    }
  }, [
    client,
    infiniteSubscription,
    requestMessage,
    requestTopic,
    response?.remaining_subscription_count,
    responseTopic,
  ]);

  return { response, isLoading, error };
}
