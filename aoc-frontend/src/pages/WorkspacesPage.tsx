import { useEffect } from "react";
import { useTitleBar } from "@/context/TitleBarProvider";
import { RefreshCw, Table } from "lucide-react";
import { WorkspacesListSection } from "@/components/workspaces/WorkspacesListSection";
import { Button } from "@/components/ui/button";
import { useWorkspacesQuery } from "@/hooks/useWorkspacesQuery";
import AutomateProcessButton from "@/components/processes/AutomateProcessButton";

const WorkspacesPage = () => {
  const { setTitle, setIcon, setButtons } = useTitleBar();
  const { refetch, isFetching } = useWorkspacesQuery();

  useEffect(() => {
    setTitle("Workspaces");
    setIcon(<Table size={24} />);
    setButtons(
      <>
        <AutomateProcessButton />
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw size={20} className={isFetching ? "animate-spin" : ""} />
          Refresh
        </Button>
      </>
    )
  }, [setTitle, setIcon, setButtons, isFetching, refetch]);

  return (
    <div>
      <WorkspacesListSection />
    </div>
  );
};

export default WorkspacesPage;
