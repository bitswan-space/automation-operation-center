"use client";

import type {
  ContainerServiceTopologyResponse,
  PipelineTopology,
  PipelineWithStats,
  WorkspaceTopologyResponse,
} from "@/types";

import React from "react";
import { useMQTTRequestResponse } from "@/shared/hooks/useMQTTRequestResponse";
import { usePipelineStats } from "./usePipelineStats";

export const usePipelinesWithStats = (): {
  pipelinesWithStats: PipelineWithStats[];
} => {
  const pipelineStats = usePipelineStats();

  const { response: workspaceTopology } =
    useMQTTRequestResponse<WorkspaceTopologyResponse>({
      requestTopic: `/automation-servers/+/c/+/topology/subscribe`,
      responseTopic: `/automation-servers/+/c/+/topology`,
    });

  console.log("workspaceTopology", workspaceTopology);

  const pipelines: (PipelineTopology & { _key: string })[] = React.useMemo(
    () =>
      Object.entries(workspaceTopology?.topology ?? {}).map(
        ([key, value]) => {
          return {
            _key: key,
            ...value,
          };
        },
      ),
    [workspaceTopology],
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
