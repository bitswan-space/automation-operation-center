import React from "react";
import { ArrowLeft, Server } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";
import { type Workspace } from "@/data/automation-server";
import { PipelineDataTable } from "../pipeline/PipelineDataTable";
import { useAutomations } from "@/context/AutomationsProvider";
import { PipelineDataCardList } from "../pipeline/PipelineDataCardList";
import { VscVscode } from "react-icons/vsc";

type WorkspaceDetailSectionProps = {
  workspace?: Workspace;
};

export function WorkspaceDetailSection(
  props: WorkspaceDetailSectionProps,
) {
  const { workspace } = props;

  const { automationServers, isLoading } = useAutomations();

  // Debug logging
  console.log("WorkspaceDetailSection - workspace:", workspace);
  console.log("WorkspaceDetailSection - automationServers:", automationServers);
  console.log("WorkspaceDetailSection - isLoading:", isLoading);

  const automationServer = automationServers[workspace?.automation_server ?? ""];
  const workspacePipelines = automationServer?.workspaces[workspace?.id ?? ""]?.pipelines;
  
  console.log("WorkspaceDetailSection - automationServer:", automationServer);
  console.log("WorkspaceDetailSection - workspacePipelines:", workspacePipelines);
  
  return (
    <div className="container mx-auto flex-1 px-0 py-4">
      <header className="rounded-md border border-slate-300 bg-white p-4 px-0 shadow-sm">
        <div className="container mx-auto">
          <div className="mb-4 flex items-center">
            <Button variant="ghost" size="sm" asChild className="mr-2">
              <Link to={`/automation-servers/${workspace?.automation_server}`}>
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to server
              </Link>
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded bg-blue-100 text-blue-600">
                <Server className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  {workspace?.name}
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>
                    {workspacePipelines?.length ?? 0} automations
                  </span>
                  {isLoading && <span className="text-blue-500">(Loading...)</span>}
                </div>
              </div>
            </div>
            {workspace?.editor_url && (
              <Link to={workspace.editor_url} target="_blank">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <div className="flex items-center gap-2">
                    {VscVscode({ size: 20 })} Editor
                  </div>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>
      
      {isLoading ? (
        <div className="p-4 text-center text-gray-500">
          Loading pipeline data...
        </div>
      ) : (
        <>
          <PipelineDataCardList pipelines={workspacePipelines ?? []} />
          <div className="hidden py-4 lg:block">
            <Card
              className={
                "h-full w-full rounded-md border border-slate-300 shadow-sm"
              }
            >
              <CardContent className="p-3">
                <PipelineDataTable pipelines={workspacePipelines ?? []} isLoading={isLoading} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
