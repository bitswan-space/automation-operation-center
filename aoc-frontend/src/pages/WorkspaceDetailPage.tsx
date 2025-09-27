import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useEffect, useState } from "react";
import { TitleBar } from "@/components/layout/TitleBar";
import { getAutomationServers } from "@/data/automation-server";
import { WorkspaceDetailSection } from "@/components/workspaces/WorkspaceDetailSection";
import { useParams } from "react-router-dom";

const WorkspaceDetailPage = () => {
  const { id, workspaceId } = useParams<{ id: string; workspaceId: string }>();
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const automationServers = await getAutomationServers();

        const automationServer = automationServers.results.find(
          (server: any) => server.automation_server_id === id,
        );

        const workspaceData = automationServer?.workspaces?.find(
          (workspace: any) => workspace.id === workspaceId,
        );

        setWorkspace(workspaceData);
      } catch (error) {
        console.error("Error loading workspace data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id && workspaceId) {
      loadData();
    }
  }, [id, workspaceId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-stone-700 md:hidden">
        Workspace Details
      </h1>
      <TitleBar title="Workspace Details" />
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

export default WorkspaceDetailPage;