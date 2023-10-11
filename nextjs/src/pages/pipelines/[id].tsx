import {} from "../../components/metrics/charts/EPSSyncAreaChart";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { type NextPageWithLayout } from "../_app";
import { type ReactElement } from "react";
import React from "react";
import { usePipelinesWithStats } from "@/components/pipeline/hooks";
import { TitleBar } from "@/components/layout/TitleBar";
import { useRouter } from "next/router";
import { formatPipelineName } from "@/utils/pipelineUtils";
import Link from "next/link";
import { PipelineDetailTabs } from "../../components/pipeline/PipelineDetailTabs";
import * as mqtt from "mqtt/dist/mqtt.min";
import { v4 as uuidv4 } from "uuid";
import { type PipelineNode } from "@/types";

const PipelineDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id } = router.query;

  const { pipelinesWithStats: pipelines } = usePipelinesWithStats();
  const pipeline = pipelines.find((p) => p.id === id);

  const mqttClientRef = React.useRef<null | mqtt.MqttClient>(null);

  const [pipelineTopology, setPipelineTopology] =
    React.useState<PipelineNode[]>();

  const requestTopic = `${id as string}/Metrics/get`;
  const responseTopic = `${id as string}/Metrics`;

  type PipelineTopologyResponse = {
    topology: PipelineNode[];
  };

  React.useEffect(() => {
    if (!mqttClientRef.current) {
      mqttClientRef.current = mqtt.connect("mqtt://127.0.0.1:9001", {
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

    mqttClientRef.current?.on("connect", () => {
      console.log("Connected to MQTT Broker");
      mqttClientRef.current?.subscribe(responseTopic, (err) => {
        if (!err) {
          console.log("Subscribed to ", responseTopic);
          mqttClientRef.current?.publish(requestTopic, "get");
        } else {
          console.log("Error subscribing: ", err);
        }
      });
    });

    mqttClientRef.current?.on("error", (err) => {
      console.error("MQTT Error:", err);
      mqttClientRef.current?.end();
    });

    mqttClientRef.current?.on("message", (topic, message) => {
      const res: PipelineTopologyResponse = JSON.parse(
        message.toString(),
      ) as PipelineTopologyResponse;

      setPipelineTopology(res.topology);

      mqttClientRef.current?.end();
    });
  }, [requestTopic, responseTopic]);

  return (
    <>
      <div className="h-screen p-4 lg:p-8">
        <h1 className="text-2xl font-bold text-stone-700 md:hidden">
          Running Pipelines
        </h1>
        <TitleBar title={"Running Pipelines"} />

        <div className="space-x-4 py-2 text-sm font-semibold text-neutral-600">
          <Link href={"/"} className="underline">
            Running Pipelines
          </Link>
          <span className="text-lg">&#x25B8;</span>
          <span className="underline">
            {formatPipelineName(pipeline?.name ?? "N/A")}
          </span>
        </div>
        <div className="h-full py-2">
          <PipelineDetailTabs
            pipeline={pipeline}
            pipelineTopology={pipelineTopology}
          />
        </div>
      </div>
    </>
  );
};

PipelineDetailPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default PipelineDetailPage;
