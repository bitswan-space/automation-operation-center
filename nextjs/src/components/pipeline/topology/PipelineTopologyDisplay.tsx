import ReactFlow, {
  Background,
  Controls,
  type Node,
  type Edge,
  type OnConnect,
  addEdge,
  applyNodeChanges,
  type NodeChange,
  applyEdgeChanges,
  type EdgeChange,
} from "reactflow";

import { useCallback } from "react";
import PipelineNode, { type NodeData } from "./PipelineNode";
import React from "react";

// we define the nodeTypes outside of the component to prevent re-renderings
// you could also use useMemo inside the component
const nodeTypes = { processor: PipelineNode };
const fitViewOptions = {
  padding: 3,
};

interface PipelineTopologyDisplayProps {
  pipelineParentIDs: string[];
  initialNodes: Node[];
  initialEdges: Edge[];
}

export const PipelineTopologyDisplay = (
  props: PipelineTopologyDisplayProps,
) => {
  const { initialNodes, initialEdges, pipelineParentIDs } = props;

  const [nodes, setNodes] = React.useState<Node[]>(initialNodes);
  const [edges, setEdges] = React.useState<Edge[]>(initialEdges);

  React.useEffect(() => {
    setNodes(
      initialNodes.map((node) => ({
        ...node,
        data: { ...node.data, parentIDs: pipelineParentIDs } as NodeData,
      })),
    );
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, pipelineParentIDs]);

  React.useEffect(() => {
    setNodes(nodes);
    setEdges(edges);
  }, [setNodes, setEdges, nodes, edges]);

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      return setNodes((nds) => {
        const newChanges: NodeChange[] = [];
        changes.forEach((c) => {
          if (c.type === "dimensions") {
            const expandedNode: Node | undefined = nds.find(
              (n) => n.id === c.id,
            );

            const nodesBelow = nds.filter(
              (n) => n?.position?.y > (expandedNode?.position.y ?? 0),
            );

            nodesBelow.forEach((nb) => {
              newChanges.push({
                id: nb.id,
                type: "position",
                position: {
                  x: nb.position.x,
                  y:
                    nb.position.y +
                    ((c.dimensions?.height ?? 0) - (expandedNode?.height ?? 0)),
                },
              });
            });
          }
        });

        const newNodes = applyNodeChanges([...changes, ...newChanges], nds);

        return newNodes;
      });
    },
    [setNodes],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges],
  );

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitViewOptions={fitViewOptions}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};
