import { AutomationServerListSection } from "@/components/automation-server/AutomationServerListSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useEffect, useState } from "react";
import { useTitleBar } from "@/context/TitleBarProvider";
import { getAutomationServers } from "@/data/automation-server";
import { Plus, RefreshCw, Server } from "lucide-react";
import { ConnectAutomationServerModal } from "@/components/automation-server/ConnectAutomationServerModal";

const AutomationServersPage = () => {
  const [automationServers, setAutomationServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { setTitle, setIcon, setButtons } = useTitleBar();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [highlightedServerId, setHighlightedServerId] = React.useState<string | null>(null);

  // Construct API URL for CLI commands (base backend URL without /api/frontend)
  const currentHost = window.location.hostname;
  const protocol = "https:";
  const backendHost = currentHost.replace(/^aoc\./, 'api.');
  const apiUrl = `${protocol}//${backendHost}`;

  useEffect(() => {
    // Handle server creation callback
    const handleServerCreated = (serverId: string) => {
      setHighlightedServerId(serverId);
      // Remove highlighting after 5 seconds
      setTimeout(() => {
        setHighlightedServerId(null);
      }, 5000);
      
      // Refresh the automation servers list
      setIsRefreshing(true);
    };
    
    setTitle("Automation Servers");
    setIcon(<Server size={24} />);
    setButtons(
      <>
        <Button
          variant="outline"
          onClick={() => setIsRefreshing(true)}
          disabled={isRefreshing}
        >
          <RefreshCw size={20} className={isRefreshing ? "animate-spin" : ""} />
          Refresh
        </Button>
        <ConnectAutomationServerModal
          apiUrl={apiUrl}
          onServerCreated={handleServerCreated}
        >
          <Button>
            <Plus size={20} />
            New server
          </Button>
        </ConnectAutomationServerModal>
      </>
    )
  }, [setTitle, setIcon, setButtons, isRefreshing, apiUrl]);

  useEffect(() => {
    const loadAutomationServers = async () => {
      try {
        const servers = await getAutomationServers();
        const formattedServers = servers.results.map(
          (server: any) => ({
            id: server.id,
            name: server.name,
            automation_server_id: server.automation_server_id,
            workspaces: server.workspaces,
            is_connected: true,
            updated_at: server.updated_at,
            created_at: new Date(server.created_at).toTimeString(),
          }),
        );
        setAutomationServers(formattedServers);
      } catch (error) {
        console.error("Error loading automation servers:", error);
      } finally {
        setIsRefreshing(false);
        setLoading(false);
      }
    };

    loadAutomationServers();
  }, [isRefreshing]);

  return (
    <div>
      {!loading && (
        <AutomationServerListSection servers={automationServers} highlightedServerId={highlightedServerId} />
      )}
    </div>
  );
};

export default AutomationServersPage;
