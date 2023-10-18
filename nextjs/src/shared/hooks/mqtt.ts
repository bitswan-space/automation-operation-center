import type * as mqtt from "mqtt/dist/mqtt.min";

import React from "react";
import { useMQTTStore } from "@/store/mqtt";

type OnMessageCallbackHandler = (topic: string, message: Buffer) => void;

export interface UseMQTTProps {
  onConnect?: () => void;
  requestResponseTopicHandlers?: {
    requestTopic: string;
    responseTopic: string;
    handler: mqtt.OnMessageCallback;
  }[];
  subscriptionTopicHandlers?: {
    topic: string;
    handler: mqtt.ClientSubscribeCallback;
  }[];
  publishTopicHandlers?: {
    topic: string;
    handler: OnMessageCallbackHandler;
  }[];
}

export function useMQTT(props: UseMQTTProps) {
  const { onConnect, requestResponseTopicHandlers } = props;

  const initMQTT = useMQTTStore((state) => state.initialiseConnection);
  const closeMQTT = useMQTTStore((state) => state.closeConnection);

  React.useEffect(() => {
    initMQTT();
    return () => {
      closeMQTT();
    };
  }, [closeMQTT, initMQTT]);

  const mqttClient = useMQTTStore((state) => state.client);

  React.useEffect(() => {
    mqttClient?.on("connect", () => {
      console.log("Connected to MQTT Broker");
      onConnect?.();

      requestResponseTopicHandlers?.forEach((handler) => {
        mqttClient?.subscribe(handler.responseTopic, (err) => {
          if (!err) {
            console.log("Subscribed to: ", handler.responseTopic);
            console.log("Publishing request to: ", handler.requestTopic);
            mqttClient?.publish(handler.requestTopic, "get");
          } else {
            console.log("Error subscribing: ", err);
          }
        });
      });
    });

    mqttClient?.on("error", (err) => {
      console.error("MQTT Error:", err);
      mqttClient?.end();
    });

    mqttClient?.on("message", (topic, message, packet) => {
      const th = requestResponseTopicHandlers?.find(
        (t) => t.responseTopic === topic,
      );

      th?.handler(topic, message, packet);
    });
  }, [mqttClient, onConnect, requestResponseTopicHandlers]);
}
