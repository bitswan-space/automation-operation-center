import {
  type Pipeline,
  type DockerContainer,
  type Endpoint,
  type PipelineStat,
  type PipelineWithStats,
  type PipelineNode,
  type ServicePreparationResponse,
} from "@/types";
import axios from "axios";
import { useQueries, useQuery } from "@tanstack/react-query";
import React from "react";

const API_BASE_URL = "/api";

const ENDPOINTS_URL = `${API_BASE_URL}/pipelines/portainer/endpoints`;

export const fetchEndpoints = (): Promise<Endpoint[]> => {
  return axios.get<Endpoint[]>(ENDPOINTS_URL).then((response) => response.data);
};

export const useEndpoints = () => {
  return useQuery({
    queryKey: ["endpoints"],
    queryFn: () => fetchEndpoints(),
  });
};

export const fetchDockerContainers = (
  endpointId: string,
  endpointName: string,
): Promise<DockerContainer[] & { endpointName?: string }> => {
  return axios
    .get<DockerContainer[]>(
      `${API_BASE_URL}/pipelines/portainer/containers?endpointId=${endpointId}`,
    )
    .then((response) =>
      response.data.map((container) => ({
        ...container,
        EndpointName: endpointName,
      })),
    );
};

export const useDockerContainers = (
  endpointId: string,
  endpointName: string,
) => {
  return useQuery({
    queryKey: ["docker-containers", endpointId],
    queryFn: () => fetchDockerContainers(endpointId, endpointName),
    enabled: !!endpointId,
  });
};

export const useListDockerContainers = () => {
  const { data: endpoints } = useEndpoints();

  return useQueries({
    queries:
      endpoints?.map((endpoint: Endpoint) => ({
        queryKey: ["docker-containers", endpoint.Id],
        queryFn: () => fetchDockerContainers(endpoint.Id, endpoint.Name),
      })) ?? [],
  });
};

export const usePipelineDockerContainers = () => {
  const results = useListDockerContainers();

  const dockerContainers = results?.map((result) => result?.data).flat();

  const pipelineDockerContainers = dockerContainers?.filter(
    (dockerContainer) => {
      return dockerContainer?.Labels?.[
        "space.bitswan.pipeline.protocol-version"
      ];
    },
  );

  return {
    pipelineDockerContainers,
    isLoading: results.some((result) => result.isLoading),
    isError: results.some((result) => result.isError),
  };
};

export const usePipelines = (): {
  pipelines: Pipeline[];
  isError: boolean;
  isLoading: boolean;
} => {
  const { pipelineDockerContainers, isError, isLoading } =
    usePipelineDockerContainers();

  const pipelines = pipelineDockerContainers?.map((dockerContainer) => {
    return {
      id: dockerContainer?.Id ?? "",
      name: dockerContainer?.Names?.[0] ?? "",
      dateCreated: convertUnixTimestampToDate(
        dockerContainer?.Created ?? 0,
      ).toLocaleString(),
      machineName: dockerContainer?.EndpointName ?? "",
      status: dockerContainer?.State ?? "",
      upTime: dockerContainer?.Status ?? "",
    };
  });

  return { pipelines, isError, isLoading };
};

const convertUnixTimestampToDate = (unixTimestamp: number) => {
  return new Date(unixTimestamp * 1000);
};

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
  isError: boolean;
  isLoading: boolean;
} => {
  const { pipelines, isLoading, isError } = usePipelines();
  const pipelineStats = usePipelineStats();

  const pipelinesWithStats = pipelines?.map((pipeline) => {
    const pipelineStat = pipelineStats?.filter((pipelineStat) =>
      pipeline.id.startsWith(pipelineStat.host),
    );

    return {
      ...pipeline,
      pipelineStat,
    };
  });

  return { pipelinesWithStats, isLoading, isError };
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
