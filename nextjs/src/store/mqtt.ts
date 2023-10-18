import * as mqtt from "mqtt/dist/mqtt.min";

import { create } from "zustand";
import { env } from "@/env.mjs";

type MQTTStore = {
  client: mqtt.MqttClient | null;
  initialiseConnection: () => void;
  closeConnection: () => void;
};

export const useMQTTStore = create<MQTTStore>()((set) => ({
  client: null,
  initialiseConnection: () =>
    set((state) => {
      let client = null;

      if (!state.client) {
        client = mqtt.connect(env.NEXT_PUBLIC_MQTT_URL, {
          keepalive: 10,
          reschedulePings: true,
          protocolId: "MQTT",
          reconnectPeriod: 1000,
          connectTimeout: 3 * 1000,
          clean: true,
          queueQoSZero: true,
          clientId: "mqttjs_" + Math.random().toString(16).substr(2, 8),
          // log: console.log,
        });
      }

      return { client: client ?? state.client };
    }),
  closeConnection: () =>
    set((state) => {
      if (state.client) {
        state.client.removeAllListeners();
        state.client.end();
      }

      return { client: null };
    }),
}));
