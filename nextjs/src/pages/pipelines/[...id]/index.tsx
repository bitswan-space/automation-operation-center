import {} from "../../../components/metrics/charts/EPSSyncAreaChart";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { type NextPageWithLayout } from "../../_app";
import { type ReactElement } from "react";
import React from "react";
import { usePipelinesWithStats } from "@/components/pipeline/hooks";
import { TitleBar } from "@/components/layout/TitleBar";
import {
  flattenTopology,
  formatPipelineName,
  joinIDsWithDelimiter,
} from "@/utils/pipelineUtils";
import Link from "next/link";
import { PipelineDetailTabs } from "../../../components/pipeline/PipelineDetailTabs";
import { type PumpTopologyResponse, type PipelineNode } from "@/types";
import type * as next from "next";
import { useMQTTRequestResponseSubscription } from "@/shared/hooks/mqtt";
import { splitArrayUpToElementAndJoin } from "@/utils/arrays";

interface PipelineDetailPageProps {
  id: string | string[];
}

const PipelineDetailPage: NextPageWithLayout<PipelineDetailPageProps> = ({
  id,
}) => {
  const { pipelinesWithStats: pipelines } = usePipelinesWithStats();
  const pipeline = pipelines.find((p) => p.id === id?.[0]);

  const [pipelineTopology, setPipelineTopology] =
    React.useState<PipelineNode[]>();

  const pipelineTopologyRequestTopic = `${joinIDsWithDelimiter(
    id as string[],
    "/",
  )}/topology/get`;

  const pipelineTopologyResponseTopic = `${joinIDsWithDelimiter(
    id as string[],
    "/",
  )}/topology`;

  const {} = useMQTTRequestResponseSubscription<PumpTopologyResponse>({
    queryKey: "topology-subscription",
    requestResponseTopicHandler: {
      requestTopic: pipelineTopologyRequestTopic,
      responseTopic: pipelineTopologyResponseTopic,
      requestMessageType: "json",
      requestMessage: {
        method: "get",
      },
      onMessageCallback: (response) => {
        const topology = flattenTopology(response);
        setPipelineTopology(topology);
      },
    },
  });

  const getBreadcrumbs = (pipelineIDs: string[]) => {
    return pipelineIDs.map((id, index) => {
      if (index === 0) {
        return (
          <React.Fragment key={id}>
            <Link href={"/"} className="underline">
              Running Pipelines
            </Link>
            <span className="text-lg">&#x25B8;</span>
            <Link href={`/pipelines/${id}`} className="underline">
              {formatPipelineName(pipeline?.name ?? "N/A")}
            </Link>
          </React.Fragment>
        );
      }

      console.log(splitArrayUpToElementAndJoin<string>(pipelineIDs, id));
      return (
        <React.Fragment key={id}>
          <span className="text-lg">&#x25B8;</span>
          <Link
            href={`/pipelines/${splitArrayUpToElementAndJoin<string>(
              pipelineIDs,
              id,
            )}`}
            className="underline"
          >
            {id}
          </Link>
        </React.Fragment>
      );
    });
  };

  return (
    <>
      <div className="h-screen p-4 lg:p-8">
        <h1 className="text-2xl font-bold text-stone-700 md:hidden">
          Running Pipelines
        </h1>
        <TitleBar title={"Running Pipelines"} />

        <div className="space-x-4 py-2 text-sm font-semibold text-neutral-600">
          {getBreadcrumbs(id as string[])}
        </div>
        <div className="h-full py-2">
          <PipelineDetailTabs
            pipelineParentIDs={(id as string[]) ?? []}
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

  const pipelineId = id as string[];

  return {
    props: {
      id: pipelineId,
    },
  };
}

export default PipelineDetailPage;
