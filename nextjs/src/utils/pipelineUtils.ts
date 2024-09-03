import { type PipelineNode, type PumpTopologyResponse } from "@/types";

export const formatPipelineName = (pipelineName: string) => {
  return pipelineName.startsWith("/") ? pipelineName.slice(1) : pipelineName;
};

export function flattenTopology(
  response: PumpTopologyResponse | null,
): PipelineNode[] {
  const flattenedArray: PipelineNode[] = [];

  for (const [id, value] of Object.entries(response?.data.topology ?? {})) {
    flattenedArray.push({
      id,
      ...value,
    });
  }

  return flattenedArray;
}

export function joinIDsWithDelimiter(ids: string[], delimiter: string): string {
  const joinedIDs = ids
    ?.map((id, index) => {
      if (index === 0) return `/c/${id}`;

      return `c/${id}`;
    })
    .join(delimiter);
  return joinedIDs;
}
