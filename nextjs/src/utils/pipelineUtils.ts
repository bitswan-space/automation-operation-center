import { type PipelineNode, type PumpTopologyResponse } from "@/types";

export const formatPipelineName = (pipelineName: string) => {
  return pipelineName.startsWith("/") ? pipelineName.slice(1) : pipelineName;
};

export function flattenTopology(
  response: PumpTopologyResponse,
): PipelineNode[] {
  const flattenedArray: PipelineNode[] = [];

  for (const [id, value] of Object.entries(response.topology)) {
    flattenedArray.push({
      id,
      ...value,
    });
  }

  return flattenedArray;
}
