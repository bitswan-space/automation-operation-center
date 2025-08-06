import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { type PipelineNode, type PipelineWithStats } from "@/types";

import { Button } from "../ui/button";
import { EPSSyncAreaChart } from "../metrics/charts/EPSSyncAreaChart";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ExternalLink, PencilLine } from "lucide-react";
import React from "react";
import { Skeleton } from "../ui/skeleton";
import { Textarea } from "../ui/textarea";
import { convertTopologyToMermaidGraph } from "@/utils/mermaid";
import dynamic from "next/dynamic";
import { formatPipelineName } from "@/utils/pipelineUtils";
import Link from "next/link";
import { VscVscode } from "react-icons/vsc";

const MermaidTopologyOverview = dynamic(
  () => import("./overview/TopologyOverview"),
  { ssr: false },
);

interface PipelineSummaryProps {
  pipeline?: PipelineWithStats;
  pipelineTopology: PipelineNode[];
  onClickPipelineTopology?: () => void;
  vscode_link?: string | null;
}

export function PipelineSummary(props: PipelineSummaryProps) {
  const { pipeline, pipelineTopology, onClickPipelineTopology, vscode_link } = props;

  const [mermaidChart, setMermaidChart] = React.useState("");
  const [showMermaid, setShowMermaid] = React.useState(false);

  React.useEffect(() => {
    setInterval(() => {
      setShowMermaid(true);
    }, 1500);
  }, []);

  React.useEffect(() => {
    const mermaidChart = convertTopologyToMermaidGraph(pipelineTopology);
    setMermaidChart(mermaidChart);
  }, [pipelineTopology]);

  const [editMode, setEditMode] = React.useState(false);

  const handleEditModeToggle = () => {
    setEditMode(!editMode);
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
                className="hidden cursor-not-allowed"
                onClick={handleEditModeToggle}
                disabled
              >
                <PencilLine size={18} xlinkTitle="edit" />
              </button>
            </div>
            {vscode_link && (
              <Link href={vscode_link} target="_blank">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <div className="flex items-center gap-2">
                    <VscVscode size={20} /> Open in editor
                  </div>
                </Button>
              </Link>
            )}
          </CardTitle>
          <CardDescription>
            {pipeline?.properties["automation-url"] &&
              <div className="pb-5 pt-2">
                <Link
                  href={pipeline.properties["automation-url"]}
                  target="_blak"
                >
                  <span className="inline-flex gap-2 hover:underline">
                    <ExternalLink size={18} />
                    <span>Open automation web form</span>
                  </span>
                </Link>
              </div>
            }

            <div className="pb-10">
              This is a sample description of the pipeline. It describes what
              the pipeline does with more detail
            </div>

            <button onClick={onClickPipelineTopology}>
              {showMermaid ? (
                <MermaidTopologyOverview
                  chart={mermaidChart}
                  id={"topology-overview"}
                />
              ) : (
                <Skeleton className="h-10 w-fit p-2 px-6">
                  Loading topology...
                </Skeleton>
              )}
            </button>
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
      { /* Hidden until AoC Monitor is set up */ }
      {/* <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="text-xl">Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex w-full flex-wrap gap-2">
            <div className="flex-auto">
              <Card className="h-full rounded-md border border-neutral-300 p-2 shadow-sm md:p-4">
                <CardContent className="max-w-4xl md:pl-4">
                  <EPSSyncAreaChart data={pipeline?.pipelineStat ?? []} />
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}
