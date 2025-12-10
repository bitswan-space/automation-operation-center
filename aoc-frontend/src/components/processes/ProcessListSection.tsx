import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { PipelineWithStats, Process } from "@/types";
import ProcessesTable from "./ProcessesTable";

type ProcessListSectionProps = {
  automations: PipelineWithStats[];
  processes: Process[];
  isLoading: boolean;
  hideWorkspaceColumn?: boolean;
};

export default function ProcessListSection(
  props: ProcessListSectionProps,
) {
  const { automations, processes, isLoading, hideWorkspaceColumn } = props;

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
              automations?.length ?? 0
            )}
          </div>
        </div>
      </div>
      <ProcessesTable
        processes={processes}
        automations={automations}
        hideWorkspaceColumn={hideWorkspaceColumn}
      />
    </div>
  );
}
