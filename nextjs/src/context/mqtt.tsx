import * as mqtt from "mqtt/dist/mqtt.min";

// contexts/MqttContext.js
import React from "react";
import { env } from "@/env.mjs";
import { v4 as uuidv4 } from "uuid";

// Create a Context with null as the default value
export const MqttContext = React.createContext<null | mqtt.MqttClient>(null);

interface MqttProviderProps {
  children: React.ReactNode;
}

export function MqttProvider(props: MqttProviderProps) {
  const { children } = props;

  const mqttClientRef = React.useRef<null | mqtt.MqttClient>(null);

  // test server url :- wss://test.mosquitto.org:8081/mqtt
  React.useEffect(() => {
    if (!mqttClientRef.current) {
      mqttClientRef.current = mqtt.connect(env.NEXT_PUBLIC_MQTT_URL, {
        keepalive: 10,
        reschedulePings: true,
        protocolId: "MQTT",
        reconnectPeriod: 1000,
        connectTimeout: 3 * 1000,
        clean: true,
        queueQoSZero: true,
        clientId: uuidv4(),
        // log: console.log,
      });
    }

    // mqttClientRef.current?.on("connect", () => {
    //   console.log("Connected to MQTT Broker");
    // });

    mqttClientRef.current?.on("error", (err) => {
      console.error("MQTT Error:", err);
      mqttClientRef.current?.end();
    });

    return () => {
      mqttClientRef.current?.removeAllListeners();
      mqttClientRef.current?.end();
    };
  }, []);

  return (
    <MqttContext.Provider value={mqttClientRef.current}>
      {children}
    </MqttContext.Provider>
  );
}
