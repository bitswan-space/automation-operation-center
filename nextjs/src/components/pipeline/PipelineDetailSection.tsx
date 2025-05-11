"use client";

import Link from "next/link";
import { PipelineDetailTabs } from "./PipelineDetailTabs";
import React from "react";
import { formatPipelineName } from "@/utils/pipelineUtils";
import { splitArrayUpToElementAndJoin } from "@/utils/arrays";
import { usePipelinesWithStats } from "./hooks/usePipelinesWithStats";
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

  const getBreadcrumbs = (pipelineIDs: string[]) => {
    return pipelineIDs.map((id, index) => {
      if (index === 0) {
        return (
          <React.Fragment key={id}>
            <Link href={"/dashboard/automations"} className="underline">
              Automations
            </Link>
            <span className="text-lg">&#x25B8;</span>
            <Link href={`/dashboard/automation-servers/${automationServerId}/workspaces/${workspaceId}/automations/${id}`} className="underline">
              {formatPipelineName(automation?.properties.name ?? "N/A")}
            </Link>
          </React.Fragment>
        );
      }

      return (
        <React.Fragment key={id}>
          <span className="text-lg">&#x25B8;</span>
          <Link
            href={`/dashboard/automation-servers/${automationServerId}/workspaces/${workspaceId}/automations/${id}`}
            className="underline"
          >
            {id}
          </Link>
        </React.Fragment>
      );
    });
  };
  return (
    <>
      <div className="space-x-4 py-2 text-sm font-semibold text-neutral-600">
        {getBreadcrumbs(ids ?? [])}
      </div>
      <div className="h-full py-2">
        <PipelineDetailTabs
          automationServerId={automationServerId}
          workspaceId={workspaceId}
          pipeline={automation}
          pipelineParentIDs={ids ?? []}
        />
      </div>
    </>
  );
};
