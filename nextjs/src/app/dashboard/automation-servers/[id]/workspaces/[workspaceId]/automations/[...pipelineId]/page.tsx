import { PipelineDetailSection } from "@/components/pipeline/PipelineDetailSection";
import { TitleBar } from "@/components/layout/TitleBar";
import { getAutomationServers } from "@/data/automation-server";
import React from "react";
import Link from "next/link";

const AutomationDetailPage = async (props: {
  params: Promise<{ id: string; workspaceId: string; pipelineId: string[] }>;
}) => {
  const { id, workspaceId, pipelineId } = (await props.params);

  const automationServers = await getAutomationServers();

  const automationServer = automationServers.results.find(
    (server) => server.automation_server_id === id,
  );

  const workspace = automationServer?.workspaces?.find(
    (workspace) => workspace.id === workspaceId,
  );

  const getBreadcrumbs = (pipelineIDs: string[]) => {
    return pipelineIDs.map((id, index) => {
      if (index === 0) {
        return (
          <React.Fragment key={id}>
          <Link
            href={`/dashboard/automation-servers/${automationServer?.automation_server_id}`}
            className="underline"
          >
            {automationServer?.name}
          </Link>
          <span className="text-lg">&#x25B8;</span>
          <Link
            href={`/dashboard/automation-servers/${automationServer?.automation_server_id}/workspaces/${workspaceId}/`}
            className="underline"
          >
            {workspace?.name}
          </Link>
          <span className="text-lg">&#x25B8;</span>
          <Link
            href={`/dashboard/automation-servers/${automationServer?.automation_server_id}/workspaces/${workspaceId}/automations/${id}`}
            className="underline"
          >
            {id}
          </Link>
        </React.Fragment>
        )
      }

      return (
        <React.Fragment key={id}>
            <span className="text-lg">&#x25B8;</span>
            <Link
              href={`/dashboard/automation-servers/${automationServer?.automation_server_id}/workspaces/${workspaceId}/automations/` + pipelineIDs.join("/")}
              className="underline"
            >
              {id}
            </Link>
          </React.Fragment>
      );
    });
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-stone-700 md:hidden">
        Automation
      </h1>
      <TitleBar title={"Automation"} />
      <div className="space-x-4 py-2 text-sm font-semibold text-neutral-600">
        {getBreadcrumbs(pipelineId ?? [])}
      </div>
      <PipelineDetailSection
        automationServerId={id}
        workspaceId={workspaceId}
        ids={pipelineId}
      />
    </div>
  );
};

export default AutomationDetailPage;
