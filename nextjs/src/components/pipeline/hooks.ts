import {
  type Pipeline,
  type DockerContainer,
  type Endpoint,
  type PipelineStat,
} from "@/types";
import axios from "axios";
import { useQueries, useQuery } from "@tanstack/react-query";
import React from "react";

const API_BASE_URL = "/api";

const ENDPOINTS_URL = `${API_BASE_URL}/portainer/endpoints`;

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
      `${API_BASE_URL}/portainer/containers?endpointId=${endpointId}`,
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

  return dockerContainers?.filter((dockerContainer) => {
    return dockerContainer?.Labels?.["space.bitswan.pipeline.protocol-version"];
  });
};

export const usePipelines = (): Pipeline[] => {
  const dockerContainers = usePipelineDockerContainers();

  return dockerContainers?.map((dockerContainer) => {
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
};

const convertUnixTimestampToDate = (unixTimestamp: number) => {
  return new Date(unixTimestamp * 1000);
};

export const usePipelineStats = () => {
  const [data, setData] = React.useState<PipelineStat[]>([]);

  React.useEffect(() => {
    const eventSource = new EventSource("/api/influxdb");

    eventSource.onmessage = (event) => {
      try {
        console.log("Event Data", event.data);
        const parsedData = JSON.parse(event.data as string) as PipelineStat;

        // Make sure the parsed data is actually of the correct type.
        // This is more of a runtime check rather than TypeScript's compile-time check.

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

export const usePipelinesWithStats = () => {
  const pipelines = usePipelines();
  const pipelineStats = usePipelineStats();

  return pipelines?.map((pipeline) => {
    const pipelineStat = pipelineStats?.filter((pipelineStat) =>
      pipeline.id.startsWith(pipelineStat.host),
    );

    return {
      ...pipeline,
      pipelineStat,
    };
  });
};
