import {
  type PipelineStat,
  type PipelineWithStats,
  type PipelineNode,
  type ServicePreparationResponse,
  type ContainerServiceTopologyResponse,
} from "@/types";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useMQTTRequestResponseSubscription } from "@/shared/hooks/mqtt";

const API_BASE_URL = "/api";

export const usePipelineStats = () => {
  const [data, setData] = React.useState<PipelineStat[]>([]);

  React.useEffect(() => {
    const eventSource = new EventSource(`${API_BASE_URL}/pipelines/influxdb`);

    eventSource.onmessage = (event) => {
      try {
        // console.log("Event Data", event.data);
        const parsedData = JSON.parse(event.data as string) as PipelineStat;

        setData((prevData) => [...prevData, parsedData]);
      } catch (error) {
        console.error("Failed to parse event data:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("EventSource failed:", error);
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
        requestTopic: `/topology/get`,
        responseTopic: `/topology`,
        requestMessageType: "json",
        requestMessage: {
          method: "get",
        },
      },
    });

  const pipelines = Object.entries(
    containerServiceTopology?.topology ?? {},
  ).map(([key, value]) => {
    return {
      ...value,
      _key: key,
    };
  });

  const pipelinesWithStats = pipelines?.map((pipeline) => {
    const pipelineStat = pipelineStats?.filter((pipelineStat) =>
      pipeline.properties["deployment-id"].startsWith(pipelineStat.deployment_id),
    );

    return {
      ...pipeline,
      pipelineStat,
    };
  });

  return { pipelinesWithStats, error };
};

export const fetchPipelineTopology = (
  pipelineId: string,
): Promise<PipelineNode[]> => {
  return axios
    .get<PipelineNode[]>(`${API_BASE_URL}/pipelines/${pipelineId}/topology`)
    .then((response) => response.data);
};

export const usePipelineTopology = (pipelineId: string) => {
  return useQuery({
    queryKey: ["pipeline-topology", pipelineId],
    queryFn: () => fetchPipelineTopology(pipelineId),
  });
};

export const preparePiplelineMQTT = (): Promise<ServicePreparationResponse> => {
  return axios
    .get<ServicePreparationResponse>(`${API_BASE_URL}/pipelines/prepare-mqtt`)
    .then((response) => response.data);
};

export const usePreparePipelineMQTTService = () => {
  return useQuery({
    queryKey: ["prepare-pipeline-service-topology"],
    queryFn: () => preparePiplelineMQTT(),
  });
};
