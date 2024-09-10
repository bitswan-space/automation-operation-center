import type {
  ContainerServiceTopologyResponse,
  PipelineTopology,
  PipelineWithStats,
} from "@/types";

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
      requestMessage: {
        count: 1,
      },
    });

  const pipelines: (PipelineTopology & { _key: string })[] = Object.entries(
    containerServiceTopology?.data?.topology ?? {},
  ).map(([key, value]) => {
    return {
      _key: key,
      ...value,
    };
  });

  const pipelinesWithStats = pipelines?.map((pipeline) => {
    const pipelineStat = pipelineStats?.filter((pipelineStat) =>
      pipeline.properties["deployment-id"].startsWith(
        pipelineStat.deployment_id,
      ),
    );

    return {
      ...pipeline,
      pipelineStat,
    };
  });

  return { pipelinesWithStats };
};
