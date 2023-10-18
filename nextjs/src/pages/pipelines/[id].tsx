import {} from "../../components/metrics/charts/EPSSyncAreaChart";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { type NextPageWithLayout } from "../_app";
import { type ReactElement } from "react";
import React from "react";
import { usePipelinesWithStats } from "@/components/pipeline/hooks";
import { TitleBar } from "@/components/layout/TitleBar";
import { flattenTopology, formatPipelineName } from "@/utils/pipelineUtils";
import Link from "next/link";
import { PipelineDetailTabs } from "../../components/pipeline/PipelineDetailTabs";
import type * as mqtt from "mqtt/dist/mqtt.min";
import { type PumpTopologyResponse, type PipelineNode } from "@/types";
import type * as next from "next";
import { useMQTT } from "@/shared/hooks/mqtt";

interface PipelineDetailPageProps {
  id: string;
}

const PipelineDetailPage: NextPageWithLayout<PipelineDetailPageProps> = ({
  id,
}) => {
  const { pipelinesWithStats: pipelines } = usePipelinesWithStats();
  const pipeline = pipelines.find((p) => p.id === id);

  const [pipelineTopology, setPipelineTopology] =
    React.useState<PipelineNode[]>();

  const pumpTopologyRequestTopic = `c/${id}/topology/get`;
  const pumpTopologyResponseTopic = `c/${id}/topology`;

  const pipelineTopologyOnMessageHandler =
    React.useCallback<mqtt.OnMessageCallback>(
      (_topic, payload) => {
        const res: PumpTopologyResponse = JSON.parse(
          payload.toString(),
        ) as PumpTopologyResponse;

        console.log("Received topology response: ", res);

        const topology = flattenTopology(res);
        setPipelineTopology(topology);
      },
      [setPipelineTopology],
    );

  useMQTT({
    requestResponseTopicHandlers: [
      {
        requestTopic: pumpTopologyRequestTopic,
        responseTopic: pumpTopologyResponseTopic,
        handler: pipelineTopologyOnMessageHandler,
      },
    ],
  });

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

export function getServerSideProps(context: next.GetServerSidePropsContext) {
  const { id } = context.query;

  const pipelineId = id as string;

  return {
    props: {
      id: pipelineId,
    },
  };
}

export default PipelineDetailPage;
