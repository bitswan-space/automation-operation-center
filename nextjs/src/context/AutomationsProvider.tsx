"use client";

import { PipelineTopology, type PipelineWithStats, type WorkspaceTopologyResponse } from "@/types";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMQTTRequestResponse } from "@/shared/hooks/useMQTTRequestResponse";
import { usePipelineStats } from "@/components/pipeline/hooks/usePipelineStats";

type WorkspaceGroup = {
  workspaceId: string;
  automationServerId: string;
  pipelines: PipelineWithStats[];
}

type AutomationServerGroup = {
  serverId: string;
  workspaces: Record<string, WorkspaceGroup>;
  pipelines: PipelineWithStats[]; // All pipelines in this server across workspaces
}

type AutomationsGroups = {
  all: PipelineWithStats[];
  automationServers: Record<string, AutomationServerGroup>;
}

const AutomationsContext = createContext<AutomationsGroups | null>(null);

export const AutomationsProvider = ({ children }: { children: ReactNode }) => {
  const pipelineStats = usePipelineStats();
  // Keep track of all workspaces and their pipelines
  const [workspaces, setWorkspaces] = useState<Record<string, WorkspaceGroup>>({});

  const { response: workspaceTopology, messageTopic } =
    useMQTTRequestResponse<WorkspaceTopologyResponse>({
      requestTopic: `/automation-servers/+/c/+/topology/subscribe`,
      responseTopic: `/automation-servers/+/c/+/topology`,
    });

  // Extract server and workspace IDs from the MQTT topic
  const topicInfo = useMemo(() => {
    if (!messageTopic) return null;
    const parts = messageTopic.split('/');
    return {
      automationServerId: parts[2], // Index 2 contains server ID
      workspaceId: parts[4], // Index 4 contains workspace ID
    };
  }, [messageTopic]);

  // Update workspaces when we receive new topology
  useEffect(() => {
    if (workspaceTopology && topicInfo?.workspaceId && topicInfo?.automationServerId) {
      const { workspaceId, automationServerId } = topicInfo;

      // Process pipelines for this workspace
      // This creates a new array of pipelines that represents the current state of the workspace
      const workspacePipelines = Object.entries(workspaceTopology.topology ?? {}).map(
        ([_, value]) => ({
          _key: value.properties["container-id"],
          ...value,
          pipelineStat: pipelineStats?.filter((stat) =>
            value.properties["deployment-id"].startsWith(stat.deployment_id)
          ) || [],
          automationServerId,
          workspaceId,
        }),
      );

      // Update workspaces state by replacing the entire workspace entry
      // This ensures we only keep the current state of the workspace's pipelines
      setWorkspaces(prev => ({
        ...prev,
        [workspaceId]: {
          workspaceId,
          automationServerId,
          pipelines: workspacePipelines, // Replace entire pipeline list with current state
        },
      }));
    }
  }, [workspaceTopology, topicInfo, pipelineStats]);

  // Derive automation servers and all lists from workspaces
  const automations = useMemo(() => {
    // First, group workspaces by server to build the server structure
    const serverGroups = Object.values(workspaces).reduce((acc, workspace) => {
      const { automationServerId } = workspace;

      if (!acc[automationServerId]) {
        acc[automationServerId] = {
          serverId: automationServerId,
          workspaces: {},
          pipelines: [],
        };
      }

      acc[automationServerId].workspaces[workspace.workspaceId] = workspace;
      return acc;
    }, {} as Record<string, AutomationServerGroup>);

    // Now calculate the pipelines for each server and the total
    const allPipelines: PipelineWithStats[] = [];

    // Update server pipelines and collect all pipelines
    Object.values(serverGroups).forEach(server => {
      // Get all pipelines for this server from its workspaces
      server.pipelines = Object.values(server.workspaces).flatMap(workspace => workspace.pipelines);
      // Add them to the total
      allPipelines.push(...server.pipelines);
    });

    return {
      all: allPipelines,
      automationServers: serverGroups,
    };
  }, [workspaces]);

  return (
    <AutomationsContext.Provider value={automations}>
      {children}
    </AutomationsContext.Provider>
  );
};

export const useAutomations = () => {
  console.log("useAutomations");
  const context = useContext(AutomationsContext);
  if (!context) {
    throw new Error(
      "useAutomations must be used within a AutomationsProvider",
    );
  }
  return context;
};
