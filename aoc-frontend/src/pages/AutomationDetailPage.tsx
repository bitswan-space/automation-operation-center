import { PipelineDetailSection } from "@/components/pipeline/PipelineDetailSection";
import { TitleBar } from "@/components/layout/TitleBar";
import { getAutomationServers } from "@/data/automation-server";
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getMQTTTokens } from "@/data/mqtt";

const AutomationDetailPage = () => {
  const { id, workspaceId, pipelineId } = useParams<{ 
    id: string; 
    workspaceId: string; 
    pipelineId: string; 
  }>();
  
  const [automationServer, setAutomationServer] = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [token, setToken] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      console.log("AutomationDetailPage: Loading data with params:", { id, workspaceId, pipelineId });
      try {
        const [serversData, tokensData] = await Promise.all([
          getAutomationServers(),
          getMQTTTokens(),
        ]);

        console.log("AutomationDetailPage: Servers data:", serversData);
        console.log("AutomationDetailPage: Tokens data:", tokensData);

        const server = serversData.results.find(
          (server: any) => server.automation_server_id === id,
        );

        console.log("AutomationDetailPage: Found server:", server);

        const workspaceData = server?.workspaces?.find(
          (ws: any) => ws.id === workspaceId,
        );

        console.log("AutomationDetailPage: Found workspace:", workspaceData);

        const tokenData = tokensData.find(
          (t: any) => t.automation_server_id === id && t.workspace_id === workspaceId
        );

        console.log("AutomationDetailPage: Found token:", tokenData);

        setAutomationServer(server);
        setWorkspace(workspaceData);
        setToken(tokenData);
      } catch (error) {
        console.error("Error loading automation detail data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id && workspaceId && pipelineId) {
      loadData();
    } else {
      console.log("AutomationDetailPage: Missing required params:", { id, workspaceId, pipelineId });
      setLoading(false);
    }
  }, [id, workspaceId, pipelineId]);

  const getBreadcrumbs = () => {
    return (
      <React.Fragment>
        <Link
          to={`/automation-servers/${automationServer?.automation_server_id}`}
          className="underline"
        >
          {automationServer?.name}
        </Link>
        <span className="text-lg">&#x25B8;</span>
        <Link
          to={`/automation-servers/${automationServer?.automation_server_id}/workspaces/${workspaceId}/`}
          className="underline"
        >
          {workspace?.name}
        </Link>
        <span className="text-lg">&#x25B8;</span>
        <span className="text-neutral-600">{pipelineId}</span>
      </React.Fragment>
    );
  };

  if (loading) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-bold text-stone-700 md:hidden">
          Automation
        </h1>
        <TitleBar title={"Automation"} />
        <div className="p-4 text-center text-gray-500">
          Loading automation details...
          <div className="mt-2 text-sm">
            Params: {JSON.stringify({ id, workspaceId, pipelineId })}
          </div>
        </div>
      </div>
    );
  }

  if (!automationServer || !workspace || !pipelineId) {
    return <div>Automation not found</div>;
  }

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-stone-700 md:hidden">
        Automation
      </h1>
      <TitleBar title={"Automation"} />
      <div className="space-x-4 py-2 text-sm font-semibold text-neutral-600">
        {getBreadcrumbs()}
      </div>
      <PipelineDetailSection
        editor_url={workspace?.editor_url}
        automationServerId={id!}
        workspaceId={workspaceId!}
        ids={[pipelineId!]}
        token={token}
      />
    </div>
  );
};

export default AutomationDetailPage;
