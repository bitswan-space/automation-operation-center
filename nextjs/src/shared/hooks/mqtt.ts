import * as mqtt from "mqtt/dist/mqtt.min";

import type { SWRSubscription, SWRSubscriptionOptions } from "swr/subscription";

import React from "react";
import { env } from "@/env.mjs";
import { handleError } from "@/utils/errors";
import useSWRSubscription from "swr/subscription";

export interface RequestResponseTopicHandler<T> {
  requestTopic?: string;
  subscriptionTopic: string;
  requestMessage: string | object;
  requestMessageType?: "json" | "string";
  onMessageCallback?: (response: T) => void;
}

export interface UseNewMQTTProps<T> {
  queryKey: string;
  onConnect?: () => void;
  enabled?: boolean;
  infiniteSubscription?: boolean;
  requestResponseTopicHandler: RequestResponseTopicHandler<T>;
}

export function useMQTTRequestResponseSubscription<T>(
  props: UseNewMQTTProps<T>,
) {
  const { requestResponseTopicHandler, queryKey, infiniteSubscription } = props;

  const {
    requestMessage,
    subscriptionTopic: responseTopic,
    requestMessageType,
    requestTopic,
    onMessageCallback,
  } = requestResponseTopicHandler;

  const subscribe: SWRSubscription<string, T, Error> = React.useCallback(
    (key, { next }: SWRSubscriptionOptions<T, Error>) => {
      const client = mqtt.connect(env.NEXT_PUBLIC_MQTT_URL, {
        keepalive: 10,
        reschedulePings: true,
        protocolId: "MQTT",
        connectTimeout: 3 * 1000,
        clean: true,
        queueQoSZero: true,
        clientId: "mqttjs_" + Math.random().toString(16).substring(2, 8),
      });

      client.subscribe(responseTopic, (err) => {
        if (!err) {
          if (requestTopic) publishRequest();
        } else {
          handleError(err, "Failed to subscribe to MQTT response topic");
          next(err);
        }
      });

      const publishRequest = () => {
        if (requestMessageType === "json") {
          client.publish(requestTopic ?? "", JSON.stringify(requestMessage));
        } else {
          client.publish(requestTopic ?? "", requestMessage as string);
        }
      };

      const onMessage = (_topic: string, message: Buffer) => {
        const res = JSON.parse(message.toString()) as T & {
          remaining_subscription_count?: number;
        };
        onMessageCallback?.(res);
        next(null, res);

        // Check the remaining_subscription_count and republish if conditions are met
        if (
          infiniteSubscription &&
          res.remaining_subscription_count &&
          res.remaining_subscription_count <= 1
        ) {
          if (requestTopic) publishRequest();
        }
      };

      const onError = (err: Error) => {
        next(err);
        handleError(err, "Error processing MQTT request-response subscription");
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
      responseTopic,
      requestMessageType,
      requestTopic,
      requestMessage,
      infiniteSubscription,
      onMessageCallback,
    ],
  );

  const subscriptionKey = `${queryKey}-${requestTopic}-${responseTopic}`;
  const subscription = useSWRSubscription(subscriptionKey, subscribe);

  return subscription;
}
