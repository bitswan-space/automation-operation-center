import { ProcessorNode } from "./../../components/pipeline/topology/ProcessorNode";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { type NextPageWithLayout } from "../_app";
import { useCallback, type ReactElement } from "react";
import React from "react";
import { usePipelinesWithStats } from "@/components/pipeline/hooks";
import { TitleBar } from "@/components/layout/TitleBar";
import { useRouter } from "next/router";
import { formatPipelineName } from "@/utils/pipelineUtils";
import Link from "next/link";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  AreaChart,
} from "recharts";
import ReactFlow, {
  Controls,
  Background,
  type Node,
  addEdge,
  type Edge,
  type OnConnect,
  useNodesState,
  useEdgesState,
} from "reactflow";
import { PipelineDetailTabs } from "../../components/pipeline/PipelineDetailTabs";

const PipelineDetailPage: NextPageWithLayout = () => {
  const pipelines = usePipelinesWithStats();
  // console.log("pipelines", pipelines);

  // get id from url
  const router = useRouter();
  const { id } = router.query;

  const pipeline = pipelines.find((p) => p.id === id);
  // console.log("pipeline", pipeline);

  return (
    <>
      <div className="h-screen p-4 lg:p-8">
        <h1 className="text-2xl font-bold text-stone-700 md:hidden">
          Running Pipelines
        </h1>
        <TitleBar title={"Running Pipelines"} />

        <div className="space-x-4 py-2 text-sm font-semibold text-neutral-600">
          <Link href={"/"} className="underline">
            Running Pipelines
          </Link>
          <span className="text-lg">&#x25B8;</span>
          <span className="underline">
            {formatPipelineName(pipeline?.name ?? "N/A")}
          </span>
        </div>
        <div className="h-full py-2">
          <PipelineDetailTabs pipeline={pipeline} />
        </div>
      </div>
    </>
  );
};

PipelineDetailPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default PipelineDetailPage;

const data = [
  {
    name: "Page A",
    in: 4000,
    out: 2400,
    amt: 2400,
  },
  {
    name: "Page B",
    in: 3000,
    out: 1398,
    amt: 2210,
  },
  {
    name: "Page C",
    in: 2000,
    out: 9800,
    amt: 2290,
  },
  {
    name: "Page D",
    in: 2780,
    out: 3908,
    amt: 2000,
  },
  {
    name: "Page E",
    in: 1890,
    out: 4800,
    amt: 2181,
  },
  {
    name: "Page F",
    in: 2390,
    out: 3800,
    amt: 2500,
  },
  {
    name: "Page G",
    in: 3490,
    out: 4300,
    amt: 2100,
  },
];

export const SyncAreaChart = () => {
  return (
    <div style={{ width: "100%" }} className="space-y-10">
      <div>
        <h4 className="text-xs font-semibold uppercase text-neutral-600">
          eps.in
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            width={400}
            height={200}
            data={data}
            syncId="anyId"
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" hide />
            <YAxis hide />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="in"
              stroke="#8884d8"
              fill="#8884d8"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase text-neutral-600">
          eps.out
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            width={400}
            height={200}
            data={data}
            syncId="anyId"
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" hide />
            <YAxis hide />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="out"
              stroke="#82ca9d"
              fill="#82ca9d"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

interface SimpleAreaChartProps {
  title: string;
  type: "error" | "info";
}

export const SimpleAreaChart = (props: SimpleAreaChartProps) => {
  const { title, type } = props;

  const getColor = () => {
    switch (type) {
      case "error":
        return "#ef4444";
      case "info":
        return "#3b82f6";
      default:
        return "#ef4444";
    }
  };

  const linearGradientId = `colorEps${type}`;

  return (
    <div style={{ width: "100%" }} className="space-y-4">
      <div>
        <h4 className="text-xs font-semibold uppercase text-neutral-600">
          {title}
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            width={400}
            height={200}
            data={data}
            syncId="anyId"
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id={linearGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={getColor()} stopOpacity={0.8} />
                <stop offset="90%" stopColor={getColor()} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" hide />
            <YAxis hide />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="in"
              stroke={getColor()}
              fill={`url(#${linearGradientId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// we define the nodeTypes outside of the component to prevent re-renderings
// you could also use useMemo inside the component
const nodeTypes = { processor: ProcessorNode };
const fitViewOptions = {
  padding: 3,
};

interface FlowProps {
  initialNodes: Node[];
  initialEdges: Edge[];
}

export const FlowSchemeDisplay = (props: FlowProps) => {
  const { initialNodes, initialEdges } = props;

  const [nodes, , onNodesChange] = useNodesState<Node[]>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>(initialEdges);

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        // fitView={true}
        fitViewOptions={fitViewOptions}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};
