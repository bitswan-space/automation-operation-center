import {
  type PipelineStat,
  type PipelineWithStats,
  type ContainerServiceTopologyResponse,
  type PipelineTopology,
} from "@/types";
import React from "react";
import { useMQTTRequestResponseSubscription } from "@/shared/hooks/mqtt";
import { env } from "@/env.mjs";
import { handleError } from "@/utils/errors";

const API_BASE_URL = "/api";

export const usePipelineStats = () => {
  const [data, setData] = React.useState<PipelineStat[]>([]);

  React.useEffect(() => {
    const eventSource = new EventSource(`${API_BASE_URL}/pipelines/influxdb`);

    eventSource.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data as string) as PipelineStat;
        setData((prevData) => [...prevData, parsedData]);
      } catch (error) {
        handleError(error as Error, "Failed to parse event data");
      }
    };

    eventSource.onerror = (error) => {
      // The error event is fired when a stream is closed by the server
      // it's part of the spec and not an actual error
      if (env.NEXT_PUBLIC_NODE_ENV === "development") {
        console.error("EventSource failed:", error);
      }
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return data;
};

export const usePipelinesWithStats = (): {
  pipelinesWithStats: PipelineWithStats[];
  error?: Error;
} => {
  const pipelineStats = usePipelineStats();

  const { data: containerServiceTopology, error } =
    useMQTTRequestResponseSubscription<ContainerServiceTopologyResponse>({
      queryKey: "container-service-subscription",
      requestResponseTopicHandler: {
        requestTopic: `/c/running-pipelines/topology/subscribe`,
        responseTopic: `/c/running-pipelines/topology`,
        requestMessageType: "json",
        requestMessage: {
          count: 10,
        },
      },
    });

  const pipelines: (PipelineTopology & { _key: string })[] = Object.entries(
    containerServiceTopology?.data.topology ?? {},
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

  return { pipelinesWithStats, error };
};
