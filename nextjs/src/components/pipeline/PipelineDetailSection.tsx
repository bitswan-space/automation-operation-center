"use client";

import { PipelineDetailTabs } from "./PipelineDetailTabs";
import React from "react";
import { useAutomations } from "@/context/AutomationsProvider";

type PipelineDetailSectionProps = {
  automationServerId: string;
  workspaceId: string;
  ids: string[];
};
export const PipelineDetailSection = (props: PipelineDetailSectionProps) => {
  const { automationServerId, workspaceId, ids } = props;
  const { automationServers } = useAutomations();

  console.log("ids", ids);

  const automationServer = automationServers[automationServerId];
  const workspace = automationServer?.workspaces[workspaceId];
  const automation = workspace?.pipelines.find((p) => p.properties["deployment-id"] === ids?.[0]);

  return (
    <div className="h-full py-2">
      <PipelineDetailTabs
        automationServerId={automationServerId}
        workspaceId={workspaceId}
        pipeline={automation}
        pipelineParentIDs={ids ?? []}
      />
    </div>
  );
};
