import { type PipelineNode } from "@/types";

export function convertTopologyToMermaidGraph(nodes: PipelineNode[]): string {
  let graph = "graph LR\n"; // Start of the Mermaid graph definition

  nodes.forEach((node) => {
    // For each node, create a connection to each of its wires
    node.wires?.forEach((wire) => {
      graph += `    ${node.id}["${node.id}"] --> ${wire}["${wire}"]\n`;
    });

    // If a node has no wires, just declare the node
    if (node.wires?.length === 0) {
      graph += `    ${node.id}["${node.id}"]\n`;
    }
  });

  return graph;
}
