import { Trash2, Network, Users, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { type AutomationServer } from "@/data/automation-server";
import { useAutomations } from "@/context/AutomationsProvider";
import { DeleteAutomationServerModal } from "./DeleteAutomationServerModal";
import { useTitleBar } from "@/context/TitleBarProvider";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { formatTimeAgo } from "@/utils/time";

type AutomationServerDetailSectionProps = {
  server?: AutomationServer;
};

export function AutomationServerDetailSection(
  props: AutomationServerDetailSectionProps,
) {
  const { server } = props;
  const { isLoading, processes } = useAutomations();
  const { setTitle, setButtons } = useTitleBar();

  useEffect(() => {
    setTitle(`${server?.name} workspaces`);
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
  }, [server, setTitle, setButtons]);

  const getProcessCount = (workspaceId: string) => {
    if (!processes) return 0;
    return Object.values(processes).filter(
      (process) => process.workspace_id === workspaceId
    ).length;
  };

  const workspaces = server?.workspaces ?? [];

  return (
    <div className="mx-auto flex-1 px-0 py-4">
      {workspaces.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          No workspaces found for this server.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => (
            <Card key={workspace.id}>
              <CardHeader>
                <div>
                  <CardTitle>
                    {workspace.name}
                  </CardTitle>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Network size={16} />
                      <span>
                        {isLoading ? (
                          <Loader2 size={14} className="animate-spin inline-block" />
                        ) : (
                          getProcessCount(workspace.id)
                        )}{" "}
                        processes
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users size={16} />
                      <span>0 users</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardFooter className="px-6 py-4 gap-3">
                <Link
                  to={`/automation-servers/${server!.automation_server_id}/workspaces/${workspace.id}`}
                  className="block"
                >
                  <Button variant="outline">
                    See processes
                  </Button>
                </Link>
                <span className="text-sm text-muted-foreground">
                  {formatTimeAgo(workspace.updated_at)}
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
