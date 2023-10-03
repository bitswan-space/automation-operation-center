import {} from "../../components/metrics/charts/EPSSyncAreaChart";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { type NextPageWithLayout } from "../_app";
import { useEffect, type ReactElement, useRef, useState } from "react";
import React from "react";
import {
  usePipelinesWithStats,
  usePreparePipelineMQTTService,
} from "@/components/pipeline/hooks";
import { TitleBar } from "@/components/layout/TitleBar";
import { useRouter } from "next/router";
import { formatPipelineName } from "@/utils/pipelineUtils";
import Link from "next/link";
import { PipelineDetailTabs } from "../../components/pipeline/PipelineDetailTabs";
import { useMqttRequestResponse } from "@/lib/mqtt";
import mqtt, { type MqttClient, connect } from "mqtt";
import MQTT from "mqtt";
import { Button } from "@/components/ui/button";

const PipelineDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id } = router.query;

  const { pipelinesWithStats: pipelines } = usePipelinesWithStats();
  const pipeline = pipelines.find((p) => p.id === id);

  // const prepMQTTQuery = usePreparePipelineMQTTService();

  // const { publish, message } = useMqttRequestResponse({
  //   brokerUrl: "ws://localhost:9001",
  //   requestTopic: `${id as string}/Metrics/get`,
  //   responseTopic: `${id as string}/Metrics`,
  //   shouldConnect: !prepMQTTQuery.isLoading && !prepMQTTQuery.error,
  // });

  // React.useEffect(() => {
  //   publish("get");
  // }, [publish]);

  // console.log("mqttRes", message);
  const [messages, setMessages] = useState(["init"]);

  const clientRef = useRef<MqttClient | null>(null);

  // const requestTopic = `${id as string}/Metrics/get`;
  // const responseTopic = `${id as string}/Metrics`;

  const requestTopic = "presence";
  const responseTopic = "presence";

  useEffect(() => {
    // access client via clientRef.current
    if (!clientRef.current) {
      try {
        clientRef.current = connect("wss://test.mosquitto.org:8081/mqtt", {
          protocol: "wss",
          clientId: "unique-client-id",
          keepalive: 10,
          reconnectPeriod: 1000,
        });
      } catch (error) {
        console.log("Error connecting: ", error);
      }
    }

    if (clientRef.current) {
      clientRef.current
        .on("connect", () => {
          console.log("client connected");
          try {
            clientRef.current?.subscribe(responseTopic);
          } catch (error) {
            console.log("Error subscribing: ", error);
          }
        })
        .on("message", (message) => {
          console.log("message received: ", message.toString());
          setMessages(messages.concat(message.toString()));
        })
        .on("close", () => {
          console.log("client closed");
        })
        .on("error", (error) => {
          console.log("Error: ", error);
        });
    }

    return () => {
      // always clean up the effect if clientRef.current has a value
      if (clientRef.current) {
        clientRef.current.removeAllListeners();
        clientRef.current.end();
      }
    };
  });

  // console.log("messages", messages);

  const publishMessages = (client: MqttClient | null) => {
    if (!client) {
      console.log("(publishMessages) Cannot publish, mqttClient: ", client);
      return;
    }
    try {
      console.log("publishing to ", requestTopic);
      client.publish(requestTopic, "get");
      console.log("published");
    } catch (error) {
      console.log("Error publishng: ", error);
    }
  };

  const handlePublish = () => {
    publishMessages(clientRef.current);
  };

  return (
    <>
      <div className="h-screen p-4 lg:p-8">
        <h1 className="text-2xl font-bold text-stone-700 md:hidden">
          Running Pipelines
        </h1>
        <TitleBar title={"Running Pipelines"} />

        <div className="space-x-4 py-2 text-sm font-semibold text-neutral-600">
          <Button onClick={handlePublish}>Publish</Button>
          <Link href={"/"} className="underline">
            Running Pipelines
          </Link>
          <span className="text-lg">&#x25B8;</span>
          <span className="underline">
            {formatPipelineName(pipeline?.name ?? "N/A")}
          </span>
        </div>
        <div className="h-full py-2">
          <PipelineDetailTabs pipeline={pipeline} />
        </div>
      </div>
    </>
  );
};

PipelineDetailPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default PipelineDetailPage;
