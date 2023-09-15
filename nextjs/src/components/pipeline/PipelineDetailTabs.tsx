import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React from "react";
import { usePipelineTopology } from "@/components/pipeline/hooks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Clipboard, Workflow } from "lucide-react";
import { formatPipelineName } from "@/utils/pipelineUtils";
import { type PipelineWithStats, type PipelineNode } from "@/types";
import { Textarea } from "@/components/ui/textarea";
import { type Node, type Edge } from "reactflow";

import { SimpleAreaChart } from "@/components/metrics/charts/SimpleAreaChart";
import { PipelineTopologyDisplay } from "./topology/PipelineTopologyDisplay";
import { EPSSyncAreaChart } from "../metrics/charts/EPSSyncAreaChart";

export interface PipelineDetailTabsProps {
  pipeline?: PipelineWithStats;
}

export function PipelineDetailTabs(props: PipelineDetailTabsProps) {
  const { pipeline } = props;

  const { data: pipelineTopology } = usePipelineTopology(pipeline?.id ?? "");

  const transformTopologyToFlowNodes = (topology: PipelineNode[]): Node[] => {
    // Define the initial Y position and the spacing between nodes
    // Assumption here is that the nodes are always ordered by their index
    // The second assumption is that they're alwats in a single column
    const initialY = 0;
    const spacingY = 600;

    console.log("topology", topology);

    return topology.map((node, index) => {
      return {
        id: node.id,
        type: "processor",
        position: { x: 200, y: initialY + index * spacingY },
        data: { type: node.type, name: node.name, kind: node.kind },
      };
    });
  };

  const transformTopologyToFlowEdges = (topology: PipelineNode[]): Edge[] => {
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

  return (
    <Tabs defaultValue="summary" className="h-full w-full">
      <TabsList className="grid w-[400px] grid-cols-2 bg-neutral-200">
        <TabsTrigger value="summary" className="">
          <Clipboard size={18} className="mr-2" />
          Summary
        </TabsTrigger>
        <TabsTrigger value="scheme">
          <Workflow size={18} className="mr-2" />
          Scheme
        </TabsTrigger>
      </TabsList>
      <TabsContent value="summary">
        <PipelineSummary pipeline={pipeline} />
      </TabsContent>
      <TabsContent value="scheme" className="h-5/6">
        <Card className="h-full rounded-md">
          <CardHeader>
            <CardTitle className="text-xl">Pipeline Topology</CardTitle>
          </CardHeader>
          <CardContent className="h-5/6 w-full space-y-2">
            <PipelineTopologyDisplay
              initialNodes={transformTopologyToFlowNodes(
                pipelineTopology ?? [],
              )}
              initialEdges={transformTopologyToFlowEdges(
                pipelineTopology ?? [],
              )}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

interface PipelineSummaryProps {
  pipeline?: PipelineWithStats;
}

function PipelineSummary(props: PipelineSummaryProps) {
  const { pipeline } = props;

  const pipelineName = formatPipelineName(pipeline?.name ?? "N/A");
  return (
    <div className="space-y-6">
      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="text-xl">{pipelineName}</CardTitle>
          <CardDescription>
            This is a sample description of the pipeline. It describes what the
            pipeline does with more detail
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Pipeline Name:</Label>
              <Input id="name" defaultValue={pipelineName} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="description">Description:</Label>
              <Textarea
                id="description"
                defaultValue="This is a sample description of the pipeline. It describes what
              the pipeline does with more detail"
              />
            </div>
            <Button>Save changes</Button>
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="text-xl">Pipeline Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex w-full flex-wrap gap-2">
            <div className="flex-auto">
              <Card className="h-full rounded-md border border-neutral-300 p-4 shadow-sm">
                <CardContent className="pl-4">
                  <EPSSyncAreaChart data={pipeline?.pipelineStat ?? []} />
                </CardContent>
              </Card>
            </div>

            <div className="grid flex-auto grid-rows-2 gap-2">
              <Card className="w-full rounded-md border border-neutral-300 p-4 shadow-sm">
                <CardContent className="pl-4">
                  <SimpleAreaChart type="info" title="throughput" />
                </CardContent>
              </Card>
              <Card className="w-full rounded-md border border-neutral-300 p-4 shadow-sm">
                <CardContent className="pl-4">
                  <SimpleAreaChart type="error" title="error rate" />
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
