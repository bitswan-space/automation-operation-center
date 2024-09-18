import type {
  ContainerServiceTopologyResponse,
  PipelineTopology,
  PipelineWithStats,
} from "@/types";

import React from "react";
import { useMQTTRequestResponse } from "@/shared/hooks/useMQTTRequestResponse";
import { usePipelineStats } from "./usePipelineStats";

export const usePipelinesWithStats = (): {
  pipelinesWithStats: PipelineWithStats[];
} => {
  const pipelineStats = usePipelineStats();

  const { response: containerServiceTopology } =
    useMQTTRequestResponse<ContainerServiceTopologyResponse>({
      requestTopic: `/c/running-pipelines/topology/subscribe`,
      responseTopic: `/c/running-pipelines/topology`,
    });

  const pipelines: (PipelineTopology & { _key: string })[] = React.useMemo(
    () =>
      Object.entries(containerServiceTopology?.data?.topology ?? {}).map(
        ([key, value]) => {
          return {
            _key: key,
            ...value,
          };
        },
      ),
    [containerServiceTopology],
  );

  const pipelinesWithStats = React.useMemo(
    () =>
      pipelines?.map((pipeline) => {
        const pipelineStat = pipelineStats?.filter((pipelineStat) =>
          pipeline.properties["deployment-id"].startsWith(
            pipelineStat.deployment_id,
          ),
        );

        return {
          ...pipeline,
          pipelineStat,
        };
      }),
    [pipelineStats, pipelines],
  );

  return { pipelinesWithStats };
};
