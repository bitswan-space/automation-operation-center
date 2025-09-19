"use client";

import { PipelineDetailTabs } from "./PipelineDetailTabs";
import React from "react";
import { useAutomations } from "@/context/AutomationsProvider";
import { type TokenData } from "@/data/mqtt";

type PipelineDetailSectionProps = {
  editor_url?: string | null;
  automationServerId: string;
  workspaceId: string;
  ids: string[];
  token?: TokenData;
};
export const PipelineDetailSection = (props: PipelineDetailSectionProps) => {
  const { automationServerId, workspaceId, ids, editor_url, token } = props;
  const { automationServers } = useAutomations();

  const automationServer = automationServers[automationServerId];
  const workspace = automationServer?.workspaces[workspaceId];
  const automation = workspace?.pipelines.find((p) => p.properties["deployment-id"] === ids?.[0]);
  const vscode_link = editor_url && automation?.properties["relative-path"] &&
    editor_url + "?folder=/home/coder/workspace" + 
    `&payload=[["openFile","vscode-remote:///home/coder/workspace/${automation?.properties["relative-path"]}/main.ipynb"]]`;

  return (
    <div className="h-full py-2">
      <PipelineDetailTabs
        automationServerId={automationServerId}
        workspaceId={workspaceId}
        pipeline={automation}
        pipelineParentIDs={ids ?? []}
        vscode_link={vscode_link}
        token={token}
      />
    </div>
  );
};
