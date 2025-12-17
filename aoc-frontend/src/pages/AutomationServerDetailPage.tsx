import { AutomationServerDetailSection } from "@/components/automation-server/AutomationServerDetailSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTitleBar } from "@/context/TitleBarProvider";
import { Server, Trash2, Plus } from "lucide-react";
import { useAutomationServersQuery } from "@/hooks/useAutomationServersQuery";
import { DeleteAutomationServerModal } from "@/components/automation-server/DeleteAutomationServerModal";
import { CreateWorkspaceModal } from "@/components/automation-server/CreateWorkspaceModal";
import { useAdminStatus } from "@/hooks/useAdminStatus";

const AutomationServerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: automationServersData, refetch } = useAutomationServersQuery();
  const { setTitle, setIcon, setButtons } = useTitleBar();
  const { isAdmin } = useAdminStatus();

  const server = automationServersData?.pages.flatMap((page) => page.results).find(
    (server) => server.automation_server_id === id,
  );

  useEffect(() => {
    setTitle(`${server?.name} workspaces`);
    setIcon(<Server size={24} />);
    setButtons(
      <div className="flex gap-2">
        {isAdmin && server && (
          <CreateWorkspaceModal
            automationServerId={server.automation_server_id}
            onSuccess={() => {
              // Refresh the data
              refetch();
            }}
          >
            <Button variant="default">
              <Plus className="h-4 w-4 mr-1" />
              Create workspace
            </Button>
          </CreateWorkspaceModal>
        )}
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
      </div>
    );
  }, [server, setTitle, setButtons, setIcon, isAdmin, refetch]);

  if (!server) {
    return <div>Automation server not found</div>;
  }

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-stone-700 md:hidden">
        Automation Servers
      </h1>
      <div className="flex py-4 pt-6 lg:hidden">
        <Input
          placeholder="Find automation"
          className="rounded-r-none bg-white"
        />
        <Button type="submit" className="my-auto rounded-l-none bg-stone-800">
          Search
        </Button>
      </div>
      <AutomationServerDetailSection
        server={server}
      />
    </div>
  );
}

export default AutomationServerDetailPage;