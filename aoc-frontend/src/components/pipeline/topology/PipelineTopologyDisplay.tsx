import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  type OnConnect,
  addEdge,
  applyNodeChanges,
  type NodeChange,
  SelectionMode,
  BackgroundVariant,
  type OnNodesChange,
  applyEdgeChanges,
  type OnEdgesChange,
} from "@xyflow/react";

import React, { useCallback } from "react";
import PipelineNode from "./PipelineNode";

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
  automationServerId: string;
  workspaceId: string;
}
const panOnDrag = [1, 2];

export const PipelineTopologyDisplay = (
  props: PipelineTopologyDisplayProps,
) => {
  const {
    initialNodes,
    initialEdges,
    // pipelineParentIDs,
    // automationServerId,
    // workspaceId,
  } = props;

  const [nodes, setNodes] = React.useState<Node[]>(initialNodes);
  const [edges, setEdges] = React.useState<Edge[]>(initialEdges);

  console.log("nodes", nodes);
  console.log("edges", edges);

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [],
  );

  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      return setNodes((nds) => {
        const newChanges: NodeChange[] = [];
        changes.forEach((c) => {
          if (
            c.type === "dimensions" &&
            nds.every((n) => n.height && n.width)
          ) {
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

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [],
  );

  return (
    <div
      style={{
        height: "60vh",
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
        panOnScroll
        selectionOnDrag
        panOnDrag={panOnDrag}
        selectionMode={SelectionMode.Partial}
      >
        <Background variant={BackgroundVariant.Dots} gap={10} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
};
