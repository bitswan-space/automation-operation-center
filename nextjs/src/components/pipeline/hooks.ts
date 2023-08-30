import { type Pipeline, type DockerContainer, type Endpoint } from "@/types";
import axios from "axios";
import { useQueries, useQuery } from "@tanstack/react-query";

const API_BASE_URL = "http://127.0.0.1:3000/api";

const ENDPOINTS_URL = `${API_BASE_URL}/portainerEndpoints`;

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
      `${API_BASE_URL}/portainerContainers?endpointId=${endpointId}`,
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
