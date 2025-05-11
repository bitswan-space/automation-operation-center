import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React from "react";
import { TitleBar } from "@/components/layout/TitleBar";
import { getAutomationServers } from "@/data/automation-server";
import { WorkspaceDetailSection } from "@/components/workspaces/WorkspaceDetailSection";

const WorkspacePage = async (props: {
  params: Promise<{ id: string; workspaceId: string }>;
}) => {
  const { id, workspaceId } = await props.params;
  const automationServers = await getAutomationServers();

  const automationServer = automationServers.results.find(
    (server) => server.automation_server_id === id,
  );

  const workspace = automationServer?.workspaces?.find(
    (workspace) => workspace.id === Number(workspaceId),
  );

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-stone-700 md:hidden">
        Workspace Details
      </h1>
      <TitleBar title="Automation Servers" />
      <div className="flex py-4 pt-6 lg:hidden">
        <Input
          placeholder="Find automation"
          className="rounded-r-none bg-white"
        />
        <Button type="submit" className="my-auto rounded-l-none bg-stone-800">
          Search
        </Button>
      </div>
      <WorkspaceDetailSection 
        workspace={workspace} 
      />
    </div>
  );
};

export default WorkspacePage;
