"use client";

import { ArrowLeft, Server } from "lucide-react";
import { Card, CardContent } from "../ui/card";

import { Button } from "../ui/button";
import Link from "next/link";
import { type Workspace } from "@/data/automation-server";
import { PipelineDataTable } from "../pipeline/PipelineDataTable";
import { useAutomations } from "@/context/AutomationsProvider";
import { PipelineDataCardList } from "../pipeline/PipelineDataCardList";


type WorkspaceDetailSectionProps = {
  workspace?: Workspace;
};

export function WorkspaceDetailSection(
  props: WorkspaceDetailSectionProps,
) {
  const { workspace } = props;

  const { automationServers } = useAutomations();

  const automationServer = automationServers[workspace?.automation_server ?? ""];
  const workspacePipelines = automationServer?.workspaces[workspace?.id ?? ""]?.pipelines;
  
  return (
    <div className="container mx-auto flex-1 px-0 py-4">
      <header className="rounded-md border border-slate-300 bg-white p-4 px-0 shadow-sm">
        <div className="container mx-auto">
          <div className="mb-4 flex items-center">
            <Button variant="ghost" size="sm" asChild className="mr-2">
              <Link href={`/dashboard/automation-servers/${workspace?.automation_server}`}>
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      <PipelineDataCardList pipelines={workspacePipelines ?? []} />
      <div className="hidden py-4 lg:block">
        <Card
          className={
            "h-full w-full rounded-md border border-slate-300 shadow-sm"
          }
        >
          <CardContent className="p-3">
            <PipelineDataTable pipelines={workspacePipelines ?? []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
