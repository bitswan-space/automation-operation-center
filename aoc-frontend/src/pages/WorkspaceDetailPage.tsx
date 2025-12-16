import { useEffect, useState } from "react";
import { useTitleBar } from "@/context/TitleBarProvider";
import { useParams } from "react-router-dom";
import { Table, Lock } from "lucide-react";
import { useWorkspaceByIdQuery } from "@/hooks/useWorkspacesQuery";
import { useAutomations } from "@/context/AutomationsProvider";
import ProcessListSection from "@/components/processes/ProcessListSection";
import { Button } from "@/components/ui/button";
import { WorkspaceAccessDialog } from "@/components/workspaces/WorkspaceAccessDialog";

const WorkspaceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: workspaceData, isLoading } = useWorkspaceByIdQuery(id);
  const { processes, automationServers, isLoading: automationsLoading } = useAutomations();
  const automationServer = automationServers[workspaceData?.automation_server ?? ""];
  const workspacePipelines = automationServer?.workspaces[workspaceData?.id ?? ""]?.pipelines;
  const workspaceProcesses = Object.values(processes).filter((process) => process.workspace_id === workspaceData?.id);
  const { setTitle, setIcon, setButtons } = useTitleBar();
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    setTitle(workspaceData?.name ?? "Workspace");
    setIcon(<Table size={24} />);
    setButtons(
      <>
        <Button
          variant="outline"
          onClick={() => setDialogOpen(true)}
        >
          <Lock size={16} />
          User access
        </Button>
      </>
    )
  }, [setTitle, setIcon, setButtons, workspaceData]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!workspaceData) {
    return <div>Workspace not found</div>;
  }

  return (
    <>
      <ProcessListSection
        automations={workspacePipelines}
        processes={workspaceProcesses}
        isLoading={automationsLoading}
        hideWorkspaceColumn={true}
        lastUpdated={workspaceData.updated_at}
      />
      <WorkspaceAccessDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        workspaceId={workspaceData.id}
      />
    </>
  );
};

export default WorkspaceDetailPage;