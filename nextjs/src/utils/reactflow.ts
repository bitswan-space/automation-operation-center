import { type Edge, type Node } from "@xyflow/react";
import { type PipelineNode } from "@/types";
import { type NodeData } from "@/components/pipeline/topology/PipelineNode";

export const transformTopologyToFlowNodes = (
  topology: PipelineNode[],
  parentIDs: string[] = [],
  automationServerId = "",
  workspaceId = "",
): Node[] => {
  // Define the initial Y position and the spacing between nodes
  // Assumption here is that the nodes are always ordered by their index
  // The second assumption is that they're always in a single column
  const initialY = 0;
  const spacingY = 300;

  return topology.map((node, index) => {
    return {
      id: node.id,
      type: "processor",
      position: { x: 200, y: initialY + index * spacingY },
      // using the id as name, kind and type for now but they should be separate
      data: {
        type: node.type,
        name: node.id,
        kind: node.id,
        id: node.id,
        capabilities: node.capabilities,
        properties: node.properties,
        parentIDs,
        automationServerId,
        workspaceId,
      } as NodeData,
    } as Node;
  });
};

export const transformTopologyToFlowEdges = (
  topology: PipelineNode[],
): Edge[] => {
  return topology
    .map((node) => {
      return (
        node.wires?.flat().map((wire) => {
          return {
            id: `${node.id}-${wire}`,
            source: node.id,
            target: wire,
            animated: true,
          } as Edge;
        }) ?? []
      );
    })
    .flat();
};
