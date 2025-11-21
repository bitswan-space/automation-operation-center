import { AutomationServerListSection } from "@/components/automation-server/AutomationServerListSection";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useTitleBar } from "@/context/TitleBarProvider";
import { Plus, RefreshCw, Server } from "lucide-react";
import { ConnectAutomationServerModal } from "@/components/automation-server/ConnectAutomationServerModal";
import { useAutomationServersQuery } from "@/hooks/useAutomationServersQuery";

const AutomationServersPage = () => {
  const { setTitle, setIcon, setButtons } = useTitleBar();
  const [highlightedServerId, setHighlightedServerId] = useState<string | null>(null);
  const { data: automationServersData, isFetching, isLoading, refetch } = useAutomationServersQuery();

  useEffect(() => {
    // Handle server creation callback
    const handleServerCreated = (serverId: string) => {
      setHighlightedServerId(serverId);
      // Remove highlighting after 5 seconds
      setTimeout(() => {
        setHighlightedServerId(null);
      }, 5000);
    };
    
    setTitle("Automation Servers");
    setIcon(<Server size={24} />);
    setButtons(
      <>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw size={20} className={isFetching ? "animate-spin" : ""} />
          Refresh
        </Button>
        <ConnectAutomationServerModal
          onServerCreated={handleServerCreated}
        >
          <Button>
            <Plus size={20} />
            New server
          </Button>
        </ConnectAutomationServerModal>
      </>
    )
  }, [setTitle, setIcon, setButtons, isFetching, refetch]);

  const automationServers = automationServersData?.pages.flatMap((page) => page.results) ?? [];

  return (
    <div>
      {!isLoading && (
        <AutomationServerListSection 
          servers={automationServers} 
          highlightedServerId={highlightedServerId} 
        />
      )}
    </div>
  );
};

export default AutomationServersPage;
