import { useEffect, useMemo, useState } from "react";
import { useTitleBar } from "@/context/TitleBarProvider";
import { useParams } from "react-router-dom";
import { Table, Lock } from "lucide-react";
import { useWorkspaceByIdQuery } from "@/hooks/useWorkspacesQuery";
import { useAutomations } from "@/context/AutomationsProvider";
import ProcessListSection from "@/components/processes/ProcessListSection";
import { Button } from "@/components/ui/button";
import { WorkspaceAccessDialog } from "@/components/workspaces/WorkspaceAccessDialog";
import AutomateProcessButton from "@/components/processes/AutomateProcessButton";

const WorkspaceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: workspaceData, isLoading } = useWorkspaceByIdQuery(id);
  const { automationServers, isLoading: automationsLoading } = useAutomations();
  const automationServer =
    automationServers[workspaceData?.automation_server ?? ""];
  const workspacePipelines = useMemo(
    () =>
      automationServer?.workspaces[workspaceData?.id ?? ""]?.pipelines ?? [],
    [automationServer, workspaceData]
  );
  const workspaceProcesses = useMemo(
    () =>
      Object.values(
        automationServer?.workspaces[workspaceData?.id ?? ""]?.processes ?? {}
      ),
    [automationServer, workspaceData]
  );
  const { setTitle, setIcon, setButtons } = useTitleBar();
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    setTitle(workspaceData?.name ?? "Workspace");
    setIcon(<Table size={24} />);
    setButtons(
      <>
        <Button variant="outline" onClick={() => setDialogOpen(true)}>
          <Lock size={16} />
          User access
        </Button>
        {workspaceProcesses.length > 0 || workspacePipelines.length > 0 ? (
          <AutomateProcessButton
            workspaceId={workspaceData?.id}
            automationServerId={workspaceData?.automation_server}
          />
        ) : null}
      </>
    );
  }, [
    setTitle,
    setIcon,
    setButtons,
    workspaceData,
    workspaceProcesses,
    workspacePipelines,
  ]);

  if (isLoading || automationsLoading) {
    return <div>Loading...</div>;
  }

  if (!workspaceData) {
    return <div>Workspace not found</div>;
  }

  return (
    <>
      {workspaceProcesses.length > 0 || workspacePipelines.length > 0 ? (
        <ProcessListSection
          automations={workspacePipelines}
          processes={workspaceProcesses}
          isLoading={automationsLoading}
          hideWorkspaceColumn={true}
          lastUpdated={workspaceData.updated_at}
        />
      ) : (
        <div className="flex justify-center items-center h-40 border border-dashed m-4">
          <AutomateProcessButton
            workspaceId={workspaceData?.id}
            automationServerId={workspaceData?.automation_server}
          />
        </div>
      )}
      <WorkspaceAccessDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceId={workspaceData.id}
      />
    </>
  );
};

export default WorkspaceDetailPage;
