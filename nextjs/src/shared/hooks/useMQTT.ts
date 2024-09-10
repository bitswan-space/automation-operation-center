import mqtt, { type MqttClient } from "mqtt";
import { type QoS } from "mqtt-packet";
import React from "react";

export function useMQTT<PayloadT>() {
  // const [client, setClient] = React.useState<mqtt.MqttClient | null>(null);

  const clientRef = React.useRef<MqttClient | null>(null);
  const [isSubed, setIsSubed] = React.useState(false);
  const [payload, setPayload] = React.useState<{
    topic: string;
    message: PayloadT;
  } | null>(null);
  const [connectStatus, setConnectStatus] = React.useState("Connect");

  const mqttConnect = (host: string, mqttOption: mqtt.IClientOptions) => {
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
      setPayload(payload);
      console.log(
        `received message: ${message.toString()} from topic: ${topic}`,
      );
    });

    // setClient(newClient);
    clientRef.current = newClient;
  };

  const mqttDisconnect = () => {
    if (clientRef.current) {
      try {
        clientRef.current.end(false, () => {
          setConnectStatus("Connect");
          console.log("disconnected successfully");
        });
        clientRef.current = null;
        // setClient(null);
      } catch (error) {
        console.log("disconnect error:", error);
      }
    }
  };

  const mqttPublish = (context: {
    topic: string;
    qos: QoS;
    payload: string | Buffer;
  }) => {
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
        },
      );
    }
  };

  const mqttSub = (subscription: { topic: string; qos: QoS }) => {
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
  };

  const mqttUnSub = (subscription: { topic: string; qos: QoS }) => {
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
  };

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

// import mqtt from "mqtt";
// import { type QoS } from "mqtt-packet";
// import React from "react";

// export function useMQTT<PayloadT>() {
//   const [client, setClient] = React.useState<mqtt.MqttClient | null>(null);
//   const [isSubed, setIsSubed] = React.useState(false);
//   const [payload, setPayload] = React.useState<{
//     topic: string;
//     message: PayloadT;
//   } | null>(null);
//   const [connectStatus, setConnectStatus] = React.useState("Connect");

//   const mqttConnect = (host: string, mqttOption: mqtt.IClientOptions) => {
//     setConnectStatus("Connecting");
//     /**
//      * if protocol is "ws", connectUrl = "ws://broker.emqx.io:8083/mqtt"
//      * if protocol is "wss", connectUrl = "wss://broker.emqx.io:8084/mqtt"
//      *
//      * /mqtt: MQTT-WebSocket uniformly uses /path as the connection path,
//      * which should be specified when connecting, and the path used on EMQX is /mqtt.
//      *
//      * for more details about "mqtt.connect" method & options,
//      * please refer to https://github.com/mqttjs/MQTT.js#mqttconnecturl-options
//      */
//     setClient(mqtt.connect(host, mqttOption));
//   };

//   React.useEffect(() => {
//     if (client) {
//       // https://github.com/mqttjs/MQTT.js#event-connect
//       client.on("connect", () => {
//         setConnectStatus("Connected");
//         console.log("connection successful");
//       });

//       // https://github.com/mqttjs/MQTT.js#event-error
//       client.on("error", (err) => {
//         console.error("Connection error: ", err);
//         client.end();
//       });

//       // https://github.com/mqttjs/MQTT.js#event-reconnect
//       client.on("reconnect", () => {
//         setConnectStatus("Reconnecting");
//       });

//       // https://github.com/mqttjs/MQTT.js#event-message
//       client.on("message", (topic, message) => {
//         const payload = {
//           topic,
//           message: JSON.parse(message.toString()) as PayloadT,
//         };
//         setPayload(payload);
//         console.log(
//           `received message: ${message.toString()} from topic: ${topic}`,
//         );
//       });
//     }
//   }, [client]);

//   // disconnect
//   // https://github.com/mqttjs/MQTT.js#mqttclientendforce-options-callback
//   const mqttDisconnect = () => {
//     if (client) {
//       try {
//         client.end(false, () => {
//           setConnectStatus("Connect");
//           console.log("disconnected successfully");
//         });
//       } catch (error) {
//         console.log("disconnect error:", error);
//       }
//     }
//   }; // publish message
//   // https://github.com/mqttjs/MQTT.js#mqttclientpublishtopic-message-options-callback

//   const mqttPublish = (context: {
//     topic: string;
//     qos: QoS;
//     payload: string | Buffer;
//   }) => {
//     if (client) {
//       // topic, QoS & payload for publishing message
//       const { topic, qos, payload } = context;
//       client.publish(
//         topic,
//         payload,
//         {
//           qos,
//         },
//         (error) => {
//           if (error) {
//             console.log("Publish error: ", error);
//           }
//         },
//       );
//     }
//   };
//   const mqttSub = (subscription: { topic: string; qos: QoS }) => {
//     if (client) {
//       // topic & QoS for MQTT subscribing
//       const { topic, qos } = subscription; // subscribe topic
//       // https://github.com/mqttjs/MQTT.js#mqttclientsubscribetopictopic-arraytopic-object-options-callback

//       client.subscribe(
//         topic,
//         {
//           qos,
//         },
//         (error) => {
//           if (error) {
//             console.log("Subscribe to topics error", error);
//             return;
//           }

//           console.log(`Subscribe to topics: ${topic}`);
//           setIsSubed(true);
//         },
//       );
//     }
//   }; // unsubscribe topic
//   // https://github.com/mqttjs/MQTT.js#mqttclientunsubscribetopictopic-array-options-callback

//   const mqttUnSub = (subscription: { topic: string; qos: QoS }) => {
//     if (client) {
//       const { topic } = subscription;
//       client.unsubscribe(topic, (error) => {
//         if (error) {
//           console.log("Unsubscribe error", error);
//           return;
//         }

//         console.log(`unsubscribed topic: ${topic}`);
//         setIsSubed(false);
//       });
//     }
//   };

//   return {
//     client,
//     connectStatus,
//     isSubed,
//     payload,
//     mqttConnect,
//     mqttDisconnect,
//     mqttPublish,
//     mqttSub,
//     mqttUnSub,
//   };
// }
