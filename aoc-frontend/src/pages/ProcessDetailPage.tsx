import { useTitleBar } from "@/context/TitleBarProvider";
import { useWorkspaceByIdQuery } from "@/hooks/useWorkspacesQuery";
import { useAutomations } from "@/context/AutomationsProvider";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { CodeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProcessEditor from "@/components/processes/ProcessEditor";


export default function ProcessDetailPage() {
  const { setTitle, setButtons, setIcon } = useTitleBar();
  const { id, processId } = useParams<{ id: string, processId: string }>();
  const { data: workspace } = useWorkspaceByIdQuery(id);
  const { processes } = useAutomations();
  const process = processes[processId];

  useEffect(() => {
    setTitle(process?.name || "Process");
    setButtons(
      <>
        <Link to={workspace?.editor_url ?? ""} target="_blank">
          <Button>
            <CodeIcon size={16} /> Code
          </Button>
        </Link>
      </>
    )
    setIcon(null)
  }, [setTitle, setButtons, setIcon, process?.name, workspace?.editor_url])

  if (!process || !workspace) {
    return <div>Process not found</div>;
  }

  return (
    <ProcessEditor
      processId={process.id}
      workspaceId={id || process.workspace_id}
      automationServerId={process.automation_server_id}
    />
  );
}
