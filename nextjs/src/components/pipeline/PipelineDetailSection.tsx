"use client";

import { PipelineDetailTabs } from "./PipelineDetailTabs";
import React from "react";
import { useAutomations } from "@/context/AutomationsProvider";

type PipelineDetailSectionProps = {
  editor_url?: string | null;
  automationServerId: string;
  workspaceId: string;
  ids: string[];
};
export const PipelineDetailSection = (props: PipelineDetailSectionProps) => {
  const { automationServerId, workspaceId, ids, editor_url } = props;
  const { automationServers } = useAutomations();

  console.log("ids", ids);

  const automationServer = automationServers[automationServerId];
  const workspace = automationServer?.workspaces[workspaceId];
  const automation = workspace?.pipelines.find((p) => p.properties["deployment-id"] === ids?.[0]);
  const vscode_link = editor_url && editor_url + `?folder=${automation?.properties["relative-path"]}`;

  return (
    <div className="h-full py-2">
      <PipelineDetailTabs
        automationServerId={automationServerId}
        workspaceId={workspaceId}
        pipeline={automation}
        pipelineParentIDs={ids ?? []}
        vscode_link={vscode_link}
      />
    </div>
  );
};
