// mqttUtils.ts
import * as mqtt from "mqtt";

import { env } from "@/env.mjs";

interface RequestResponseTopicHandler<T> {
  requestTopic: string;
  responseTopic: string;
  requestMessage: string | object;
  requestMessageType?: "json" | "string";
  onMessageCallback?: (response: T) => void;
}

export const connectMQTT = () => {
  return mqtt.connect(env.NEXT_PUBLIC_MQTT_URL, {
    keepalive: 10,
    reschedulePings: true,
    protocolId: "MQTT",
    connectTimeout: 3 * 1000,
    clean: true,
    queueQoSZero: true,
    clientId: "mqttjs_" + Math.random().toString(16).substring(2, 8),
  });
};

export const subscribeAndPublish = <T>(
  client: mqtt.MqttClient,
  handler: RequestResponseTopicHandler<T>,
) => {
  const {
    requestTopic,
    responseTopic,
    requestMessage,
    requestMessageType,
    onMessageCallback,
  } = handler;

  client.subscribe(responseTopic, (err) => {
    if (err) {
      console.error("Error subscribing:", err);
      return;
    }
    publishRequest(client, requestTopic, requestMessage, requestMessageType);
  });

  client.on("message", (topic, message) => {
    if (topic === responseTopic) {
      const response = JSON.parse(message.toString()) as T;
      onMessageCallback?.(response);
    }
  });

  client.on("error", (err) => {
    console.error("MQTT Error:", err);
    client.end();
  });

  function publishRequest(
    client: mqtt.MqttClient,
    topic: string,
    message: string | object,
    messageType?: "json" | "string",
  ) {
    const payload = messageType === "json" ? JSON.stringify(message) : message;
    client.publish(topic, payload as string);
  }
};
