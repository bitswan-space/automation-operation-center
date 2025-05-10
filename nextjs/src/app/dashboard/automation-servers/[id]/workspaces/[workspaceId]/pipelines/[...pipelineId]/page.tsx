import React, { use } from "react";

import { PipelineDetailSection } from "@/components/pipeline/PipelineDetailSection";
import { TitleBar } from "@/components/layout/TitleBar";

const AutomationDetailPage = (props: { params: Promise<{ id: string, workspaceId: string, pipelineId: string[] }> }) => {
  const { id, workspaceId, pipelineId } = use(props.params);

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-stone-700 md:hidden">
        Automation
      </h1>
      <TitleBar title={"Automation"} />
      <PipelineDetailSection
        automationServerId={id}
        workspaceId={workspaceId}
        ids={pipelineId}
      />
    </div>
  );
};

export default AutomationDetailPage;
