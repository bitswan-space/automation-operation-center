import * as mqtt from "mqtt/dist/mqtt.min";

import type { SWRSubscription, SWRSubscriptionOptions } from "swr/subscription";

import React from "react";
import { env } from "@/env.mjs";
import useSWRSubscription from "swr/subscription";

export interface RequestResponseTopicHandler<T> {
  requestTopic: string;
  responseTopic: string;
  requestMessage: string | object;
  requestMessageType?: "json" | "string";
  onMessageCallback?: (response: T) => void;
}

export interface UseNewMQTTProps<T> {
  queryKey: string;
  onConnect?: () => void;
  enabled?: boolean;
  requestResponseTopicHandler: RequestResponseTopicHandler<T>;
}

export function useMQTTRequestResponseSubscription<T>(
  props: UseNewMQTTProps<T>,
) {
  const { requestResponseTopicHandler, queryKey, enabled } = props;

  const {
    requestMessage,
    responseTopic,
    requestMessageType,
    requestTopic,
    onMessageCallback,
  } = requestResponseTopicHandler;

  console.log(
    "Entered useMQTTRequestResponseSubscription with topics:",
    requestTopic,
    responseTopic,
  );

  const subscribe: SWRSubscription<string, T, Error> = React.useCallback(
    (key, { next }: SWRSubscriptionOptions<T, Error>) => {
      const client = mqtt.connect(env.NEXT_PUBLIC_MQTT_URL, {
        keepalive: 10,
        reschedulePings: true,
        protocolId: "MQTT",
        // reconnectPeriod: 1000,
        connectTimeout: 3 * 1000,
        clean: true,
        queueQoSZero: true,
        clientId: "mqttjs_" + Math.random().toString(16).substring(2, 8),
        // log: console.log,
      });

      client.on("connect", () => {
        console.log("Connected to MQTT Broker");

        client.subscribe(responseTopic, (err) => {
          if (!err) {
            if (requestMessageType === "json") {
              client.publish(requestTopic, JSON.stringify(requestMessage));
            } else {
              console.log("publishing string message");
              client.publish(requestTopic, requestMessage as string);
            }
          } else {
            console.log("Error subscribing: ", err);
            next(err);
          }
        });
      });

      const onMessage = (_topic: string, message: Buffer) => {
        const res: T = JSON.parse(message.toString()) as T;
        onMessageCallback?.(res);
        next(null, res);
      };

      const onError = (err: Error) => {
        next(err);
        console.error("MQTT Error:", err);
        client.end();
      };
      client.on("message", onMessage);
      client.on("error", onError);

      return () => {
        client.removeAllListeners();
        client.end();
      };
    },
    [
      requestTopic,
      responseTopic,
      requestMessageType,
      requestMessage,
      onMessageCallback,
    ],
  );

  // This ensures that the subscription key is unique for each request/response topic pair
  const subscriptionKey = `${queryKey}-${requestTopic}-${responseTopic}`;
  const subscription = useSWRSubscription(subscriptionKey, subscribe);

  return subscription;
}
