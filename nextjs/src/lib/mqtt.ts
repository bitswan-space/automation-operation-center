import mqtt, { type MqttClient, connect } from "mqtt";
import { useCallback, useEffect, useRef, useState } from "react";

type UseMqttRequestResponseProps = {
  brokerUrl: string;
  requestTopic: string;
  responseTopic: string;
  shouldConnect: boolean;
};

export function useMqttRequestResponse({
  brokerUrl,
  requestTopic,
  responseTopic,
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
        console.error("Failed to connect to MQTT broker:", error);
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
        console.error("MQTT client error:", error);
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
        mqttClient.current.publish(requestTopic, message, (err) => {
          if (err) {
            console.error(
              `Failed to publish message to topic: ${requestTopic}: ${err}`,
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
