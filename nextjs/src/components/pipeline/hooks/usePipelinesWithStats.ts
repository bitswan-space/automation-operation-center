"use client";

import type {
  PipelineTopology,
  PipelineWithStats,
  WorkspaceTopologyResponse,
} from "@/types";

import React, { useMemo } from "react";
import { useMQTTRequestResponse } from "@/shared/hooks/useMQTTRequestResponse";
import { usePipelineStats } from "./usePipelineStats";

export const usePipelinesWithStats = (): {
  pipelinesWithStats: PipelineWithStats[];
} => {
  const pipelineStats = usePipelineStats();

  const { response: workspaceTopology, messageTopic } =
    useMQTTRequestResponse<WorkspaceTopologyResponse>({
      requestTopic: `/automation-servers/+/c/+/topology/subscribe`,
      responseTopic: `/automation-servers/+/c/+/topology`,
    });

  console.log("workspaceTopology", workspaceTopology);

  const topicInfo = useMemo(() => {
    if (!messageTopic) return null;
    const parts = messageTopic.split('/');
    return {
      automationServerId: parts[2], // Index 2 contains server ID
      workspaceId: parts[4], // Index 4 contains workspace ID
    };
  }, [messageTopic]);

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
          automationServerId: topicInfo?.automationServerId ?? "",
          workspaceId: topicInfo?.workspaceId ?? "",
        };
      }),
    [pipelineStats, pipelines],
  );

  return { pipelinesWithStats };
};
