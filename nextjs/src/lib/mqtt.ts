import { type MqttClient, connect } from "mqtt";
import { useCallback, useEffect, useRef, useState } from "react";
import { handleError } from "@/utils/errors";

type UseMqttRequestResponseProps = {
  brokerUrl: string;
  requestTopic: string;
  responseTopic: string;
  shouldConnect: boolean;
};

export function useMqttRequestResponse({
  brokerUrl,
  requestTopic,
  shouldConnect,
}: UseMqttRequestResponseProps) {
  const mqttClient = useRef<MqttClient | null>(null);
  const setClient = (client: MqttClient) => {
    mqttClient.current = client;
  };
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!mqttClient.current) {
      try {
        const client = connect(brokerUrl, {
          reconnectPeriod: 1000,
        });
        setClient(client);
      } catch (error) {
        handleError(error as Error, "Failed to connect to MQTT broker");
      }
    }

    if (mqttClient.current) {
      mqttClient.current.on("connect", () => {
        console.log("Connected to MQTT broker");
      });

      mqttClient.current.on("message", (topic, message) => {
        console.log("Received message:", message.toString());
        setMessage(message.toString());
      });

      mqttClient.current.on("error", (error) => {
        handleError(error, "MQTT client error");
      });
    }

    return () => {
      if (mqttClient.current) {
        mqttClient.current.removeAllListeners();
        mqttClient.current.end();
      }
    };
  }, [brokerUrl]);

  const publish = useCallback(
    (message: string) => {
      if (!shouldConnect) {
        return;
      }
      if (mqttClient.current) {
        mqttClient.current.publish(requestTopic, message, (error) => {
          if (error) {
            handleError(
              error,
              `Failed to publish message to topic: ${requestTopic}: ${error.message}`,
            );
          }
        });
      }
    },
    [requestTopic, shouldConnect],
  );

  return {
    message,
    publish,
  };
}
