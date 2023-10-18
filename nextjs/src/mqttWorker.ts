// import { env } from "./env.mjs";
// // mqttWorker.js
// import mqtt from "mqtt";

// const MQTT_BROKER_URL = env.MQTT_URL;
// const client = mqtt.connect(MQTT_BROKER_URL);

// type Message = {
//   action: "subscribe" | "publish";
//   data: {
//     topic: string;
//     payload: string;
//   };
//   onMessage?: (data: unknown) => void;
//   onPublish?: (data: unknown) => void;
// };

// self.addEventListener("message", (event: MessageEvent<Message>) => {
//   const { action, data, onMessage } = event.data;

//   if (action === "subscribe") {
//     // Handle subscription
//     client.subscribe(data.topic);
//     client.on("message", (topic, payload) => {
//       if (topic === data.topic) {
//         onMessage?.({ topic, payload });
//       }
//     });
//   }

//   if (action === "publish") {
//     // Handle publish
//     client.publish(data.topic, data.payload);
//   }

//   // Handle other actions as needed
// });
