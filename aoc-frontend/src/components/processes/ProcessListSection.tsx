import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { PipelineWithStats, Process } from "@/types";
import ProcessesTable from "./ProcessesTable";
import { formatTimeAgo } from "@/utils/time";

type ProcessListSectionProps = {
  automations: PipelineWithStats[];
  processes: Process[];
  isLoading: boolean;
  hideWorkspaceColumn?: boolean;
  hideOther?: boolean;
  lastUpdated?: string;
};

export default function ProcessListSection(props: ProcessListSectionProps) {
  const {
    automations,
    processes,
    isLoading,
    hideWorkspaceColumn,
    hideOther,
    lastUpdated,
  } = props;

  // Count only automations that belong to a process if hideOther is true
  const automationsCount = hideOther
    ? processes?.reduce(
        (sum, process) => sum + (process.automation_sources?.length ?? 0),
        0
      ) ?? 0
    : automations?.length ?? 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-7 mt-6">
        <Separator orientation="vertical" className="h-[56px]" />
        <div className="flex-1 px-4">
          <div className="text-sm text-muted-foreground">Processes</div>
          <div className="text-2xl font-semibold flex">
            {isLoading ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              processes?.length ?? 0
            )}
          </div>
        </div>
        <Separator orientation="vertical" className="h-[56px]" />
        <div className="flex-1 px-4">
          <div className="text-sm text-muted-foreground">Automations</div>
          <div className="text-2xl font-semibold flex">
            {isLoading ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              automationsCount
            )}
          </div>
        </div>
        {lastUpdated && (
          <>
            <Separator orientation="vertical" className="h-[56px]" />
            <div className="flex-1 px-4">
              <div className="text-sm text-muted-foreground">Last update</div>
              <div className="text-2xl font-semibold flex">
                {formatTimeAgo(lastUpdated)}
              </div>
            </div>
          </>
        )}
      </div>
      <ProcessesTable
        processes={processes}
        automations={automations}
        hideWorkspaceColumn={hideWorkspaceColumn}
        hideOther={hideOther}
      />
    </div>
  );
}
