import mqtt, { type MqttClient } from "mqtt";
import { type QoS } from "mqtt-packet";
import React from "react";

export function useMQTT<PayloadT>() {
  const clientRef = React.useRef<MqttClient | null>(null);
  const [isSubed, setIsSubed] = React.useState(false);
  const [payload, setPayload] = React.useState<{
    topic: string;
    message: PayloadT;
  } | null>(null);
  const [connectStatus, setConnectStatus] = React.useState("Connect");

  const mqttConnect = React.useCallback(
    (host: string, mqttOption: mqtt.IClientOptions) => {
      setConnectStatus("Connecting");
      const newClient = mqtt.connect(host, mqttOption);

      newClient.on("connect", () => {
        setConnectStatus("Connected");
        console.log("connection successful");
      });

      newClient.on("error", (err) => {
        console.error("Connection error: ", err);
        newClient.end();
      });

      newClient.on("reconnect", () => {
        setConnectStatus("Reconnecting");
      });

      newClient.on("message", (topic, message) => {
        const payload = {
          topic,
          message: JSON.parse(message.toString()) as PayloadT,
        };
        setPayload(() => payload);
        // console.log(
        //   `received message: ${message.toString()} from topic: ${topic}`,
        // );
      });

      clientRef.current = newClient;
    },
    [],
  );

  const mqttDisconnect = React.useCallback(() => {
    if (clientRef.current) {
      try {
        clientRef.current.end(false, () => {
          setConnectStatus("Connect");
          console.log("disconnected successfully");
        });
        clientRef.current = null;
      } catch (error) {
        console.log("disconnect error:", error);
      }
    }
  }, []);

  const mqttPublish = React.useCallback(
    (context: { topic: string; qos: QoS; payload: string | Buffer }) => {
      if (clientRef.current) {
        const { topic, qos, payload } = context;
        clientRef.current.publish(
          topic,
          payload,
          {
            qos,
          },
          (error) => {
            if (error) {
              console.log("Publish error: ", error);
            }
            console.log(`Published to topic: ${topic}`);
          },
        );
      }
    },
    [],
  );

  const mqttSub = React.useCallback(
    (subscription: { topic: string; qos: QoS }) => {
      if (clientRef.current) {
        const { topic, qos } = subscription;
        clientRef.current.subscribe(
          topic,
          {
            qos,
          },
          (error) => {
            if (error) {
              console.log("Subscribe to topics error", error);
              return;
            }
            console.log(`Subscribe to topics: ${topic}`);
            setIsSubed(true);
          },
        );
      }
    },
    [],
  );

  const mqttUnSub = React.useCallback(
    (subscription: { topic: string; qos: QoS }) => {
      if (clientRef.current) {
        const { topic } = subscription;
        clientRef.current.unsubscribe(topic, (error) => {
          if (error) {
            console.log("Unsubscribe error", error);
            return;
          }
          console.log(`unsubscribed topic: ${topic}`);
          setIsSubed(false);
        });
      }
    },
    [],
  );

  React.useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.end();
      }
    };
  }, []);

  return {
    client: clientRef.current,
    connectStatus,
    isSubed,
    payload,
    mqttConnect,
    mqttDisconnect,
    mqttPublish,
    mqttSub,
    mqttUnSub,
  };
}
