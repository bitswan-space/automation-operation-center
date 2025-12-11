import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTitleBar } from "@/context/TitleBarProvider";
import { Server, Trash2 } from "lucide-react";
import { useAutomationServersQuery } from "@/hooks/useAutomationServersQuery";
import { DeleteAutomationServerModal } from "@/components/automation-server/DeleteAutomationServerModal";
import { WorkspacesListSection } from "@/components/workspaces/WorkspacesListSection";

const AutomationServerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: automationServersData } = useAutomationServersQuery();
  const { setTitle, setIcon, setButtons } = useTitleBar();

  const server = automationServersData?.pages.flatMap((page) => page.results).find(
    (server) => server.automation_server_id === id,
  );

  useEffect(() => {
    setTitle(`${server?.name} workspaces`);
    setIcon(<Server size={24} />);
    setButtons(
      <DeleteAutomationServerModal
        serverName={server?.name ?? ""}
        serverId={server?.automation_server_id ?? ""}
      >
        <Button
          variant="destructive"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete server
        </Button>
      </DeleteAutomationServerModal>
    );
  }, [server, setTitle, setButtons, setIcon]);

  if (!server) {
    return <div>Automation server not found</div>;
  }

  return (
    <div>
      <WorkspacesListSection automationServerId={id} />
    </div>
  );
}

export default AutomationServerDetailPage;