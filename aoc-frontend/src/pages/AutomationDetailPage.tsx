import { getAutomationServers } from "@/data/automation-server";
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getMQTTTokens } from "@/data/mqtt";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Globe, Code, Cog } from "lucide-react";
import { useAutomations } from "@/context/AutomationsProvider";
import { useTitleBar } from "@/context/TitleBarProvider";

const AutomationDetailPage = () => {
  const { id, workspaceId, pipelineId } = useParams<{ 
    id: string; 
    workspaceId: string; 
    pipelineId: string; 
  }>();
  
  const { automationServers, isLoading: contextLoading } = useAutomations();
  const [automationServer, setAutomationServer] = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [token, setToken] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { setTitle, setIcon } = useTitleBar();

  useEffect(() => {
    setTitle("Automations");
    setIcon(<Cog size={24} />);
  }, [setTitle, setIcon]);

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
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={`/automation-servers/${automationServer?.automation_server_id}`}>
                {automationServer?.name}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={`/automation-servers/${automationServer?.automation_server_id}/workspaces/${workspaceId}/`}>
                {workspace?.name}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{pipelineId}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  };

  if (loading || contextLoading) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-bold text-stone-700 md:hidden">
          Automation
        </h1>
        <div className="p-4 text-center text-gray-500">
          Loading automation details...
        </div>
      </div>
    );
  }

  if (!automationServer || !workspace || !pipelineId) {
    return <div>Automation not found</div>;
  }

  // Get automation data for the cards - try both data sources
  const contextAutomationServer = automationServers[id];
  const contextWorkspace = contextAutomationServer?.workspaces[workspaceId];
  const contextAutomation = contextWorkspace?.pipelines?.find((p: any) => p.properties["deployment-id"] === pipelineId);
  
  // Fallback to API data if context data is not available
  const finalAutomationServer = contextAutomationServer || automationServer;
  const finalWorkspace = contextWorkspace || workspace;
  const finalAutomation = contextAutomation || finalWorkspace?.pipelines?.find((p: any) => p.properties["deployment-id"] === pipelineId);
  
  
  // Generate editor URL - use the original workspace variable that has editor_url
  const vscode_link = workspace?.editor_url && finalAutomation?.properties["relative-path"] &&
    workspace.editor_url + "?folder=/home/coder/workspace" + 
    `&payload=[["openFile","vscode-remote:///home/coder/workspace/${finalAutomation?.properties["relative-path"]}/main.ipynb"]]`;

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-stone-700 md:hidden">
        Automation
      </h1>
      <div className="py-4">
        {getBreadcrumbs()}
      </div>
      
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Automation Web Interface Card */}
        {finalAutomation?.properties["automation-url"] && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Automation Web Interface
              </CardTitle>
              <CardDescription>
                Open the automation web form to interact with your automation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <a
                  href={finalAutomation.properties["automation-url"]}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Open Web Interface
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Open in Editor Card */}
        {vscode_link && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-green-600" />
                Open in Editor
              </CardTitle>
              <CardDescription>
                Open the automation code in your editor to view and modify the implementation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <a
                  href={vscode_link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Code className="mr-2 h-4 w-4" />
                  Open in Editor
                </a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AutomationDetailPage;
