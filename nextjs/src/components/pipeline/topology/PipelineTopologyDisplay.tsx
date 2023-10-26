import ReactFlow, {
  Background,
  Controls,
  type Node,
  type Edge,
  type OnConnect,
  addEdge,
  useEdgesState,
  useNodesState,
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

  const [initialNodesCopy, setInitialNodesCopy] = React.useState<Node[]>([]);
  const [initialEdgesCopy, setInitialEdgesCopy] = React.useState<Edge[]>([]);

  React.useEffect(() => {
    setInitialNodesCopy(
      initialNodes.map((node) => ({
        ...node,
        data: { ...node.data, parentIDs: pipelineParentIDs } as NodeData,
      })),
    );
    setInitialEdgesCopy(initialEdges);
  }, [initialNodes, initialEdges, pipelineParentIDs]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  React.useEffect(() => {
    setNodes(initialNodesCopy);
    setEdges(initialEdgesCopy);
  }, [setNodes, setEdges, initialNodesCopy, initialEdgesCopy]);

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
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
