import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Clipboard, PencilLine, Workflow } from "lucide-react";
import { formatPipelineName } from "@/utils/pipelineUtils";
import { type PipelineNode, type PipelineWithStats } from "@/types";
import { Textarea } from "@/components/ui/textarea";

import { PipelineTopologyDisplay } from "./topology/PipelineTopologyDisplay";
import { EPSSyncAreaChart } from "../metrics/charts/EPSSyncAreaChart";
import {
  transformTopologyToFlowNodes,
  transformTopologyToFlowEdges,
} from "@/utils/reactflow";

export interface PipelineDetailTabsProps {
  pipeline?: PipelineWithStats;
  pipelineTopology?: PipelineNode[];
  pipelineParentIDs: string[];
}

export function PipelineDetailTabs(props: PipelineDetailTabsProps) {
  const { pipeline, pipelineTopology, pipelineParentIDs } = props;

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
            <CardTitle className="text-xl">Container Topology</CardTitle>
          </CardHeader>
          <CardContent className="h-5/6 w-full space-y-2">
            <PipelineTopologyDisplay
              initialNodes={transformTopologyToFlowNodes(
                pipelineTopology ?? [],
              )}
              initialEdges={transformTopologyToFlowEdges(
                pipelineTopology ?? [],
              )}
              pipelineParentIDs={pipelineParentIDs}
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

  const [editMode, SetEditMode] = React.useState(false);

  const handleEditModeToggle = () => {
    SetEditMode(!editMode);
  };

  const pipelineName = formatPipelineName(pipeline?.properties.name ?? "N/A");
  return (
    <div className="space-y-6">
      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="flex gap-2 text-xl">
            <div>{pipelineName}</div>
            <div>
              <button
                className="cursor-not-allowed"
                onClick={handleEditModeToggle}
                disabled
              >
                <PencilLine size={18} xlinkTitle="edit" />
              </button>
            </div>
          </CardTitle>
          <CardDescription>
            This is a sample description of the pipeline. It describes what the
            pipeline does with more detail
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {editMode && (
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
          )}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
