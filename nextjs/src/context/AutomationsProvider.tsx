"use client";

import { type PipelineWithStats, type WorkspaceTopologyResponse } from "@/types";
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
import { type AutomationServer } from "@/data/automation-server";
import { getAutomationServersAction } from "@/data/automation-servers";

type WorkspaceGroup = {
  workspaceId: string;
  automationServerId: string;
  pipelines: PipelineWithStats[];
};

type AutomationServerGroup = {
  serverId: string;
  workspaces: Record<string, WorkspaceGroup>;
  pipelines: PipelineWithStats[]; // All pipelines in this server across workspaces
};

type AutomationsGroups = {
  all: PipelineWithStats[];
  automationServers: Record<string, AutomationServerGroup>;
  isLoading: boolean;
};

const AutomationsContext = createContext<AutomationsGroups | null>(null);

export const AutomationsProvider = ({ children, tokens }: { children: ReactNode, tokens: string[] }) => {
  const pipelineStats = usePipelineStats();

  // Keep track of all workspaces and their pipelines
  const [automationServers, setAutomationServers] = useState<
    Record<string, AutomationServer>
  >({});
  const [automationServersAreFetched, setAutomationServersAreFetched] =
    useState(false);
  const [workspaces, setWorkspaces] = useState<Record<string, WorkspaceGroup>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(true);

  const { response: workspaceTopology, messageTopic } =
    useMQTTRequestResponse<WorkspaceTopologyResponse>({
      requestTopic: `/topology/subscribe`,
      responseTopic: `/topology`,
      tokens: tokens,
    });

  // Fetch automation servers data
  useEffect(() => {
    const fetchAutomationServers = async () => {
      try {
        const servers = await getAutomationServersAction();
        const serversMap = servers.reduce(
          (acc, server) => {
            acc[server.automation_server_id] = server;
            return acc;
          },
          {} as Record<string, AutomationServer>,
        );
        setAutomationServers(serversMap);
        setAutomationServersAreFetched(true);
      } catch (error) {
        setAutomationServersAreFetched(true);
        console.error("Failed to fetch automation servers:", error);
      }
    };

    void fetchAutomationServers();
  }, []);

  useEffect(() => {
    if (!automationServersAreFetched) return;

    // Calculate expected workspaces from automation servers
    const expectedWorkspaces = Object.values(automationServers).reduce(
      (total, server) => {
        return total + (server.workspaces?.length ?? 0);
      },
      0,
    );

    // Count all loaded workspaces
    const loadedWorkspaces = Object.keys(workspaces).length;

    // Set isLoading to false when all expected workspaces are loaded
    if (loadedWorkspaces >= expectedWorkspaces) {
      setIsLoading(false);
    }
  }, [workspaces, automationServers, automationServersAreFetched]);

  // Timer to automatically unset isLoading after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  // Extract server and workspace IDs from the MQTT topic
  const topicInfo = useMemo(() => {
    if (!messageTopic) return null;
    const parts = messageTopic.split("/");
    return {
      automationServerId: parts[4], // Index 4 contains server ID
      workspaceId: parts[6], // Index 6 contains workspace ID
    };
  }, [messageTopic]);

  // Update workspaces when we receive new topology
  useEffect(() => {
    if (
      workspaceTopology &&
      topicInfo?.workspaceId &&
      topicInfo?.automationServerId
    ) {
      const { workspaceId, automationServerId } = topicInfo;

      // Get the automation server name
      const automationServer = automationServers[automationServerId];
      const automationServerName = automationServer?.name ?? automationServerId;

      // Process pipelines for this workspace
      // This creates a new array of pipelines that represents the current state of the workspace
      const workspacePipelines = Object.entries(
        workspaceTopology.topology ?? {},
      ).map(([_, value]) => ({
        _key: value.properties["container-id"],
        ...value,
        pipelineStat:
          pipelineStats?.filter((stat) =>
            value.properties["deployment-id"].startsWith(stat.deployment_id),
          ) || [],
        automationServerId,
        automationServerName,
        workspaceId,
      }));

      // Update workspaces state by replacing the entire workspace entry
      // This ensures we only keep the current state of the workspace's pipelines
      setWorkspaces((prev) => ({
        ...prev,
        [workspaceId]: {
          workspaceId,
          automationServerId,
          pipelines: workspacePipelines, // Replace entire pipeline list with current state
        },
      }));
    }
  }, [workspaceTopology, topicInfo, pipelineStats, automationServers]);

  // Derive automation servers and all lists from workspaces
  const automations = useMemo(() => {
    // First, group workspaces by server to build the server structure
    const serverGroups = Object.values(workspaces).reduce(
      (acc, workspace) => {
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
      },
      {} as Record<string, AutomationServerGroup>,
    );

    // Now calculate the pipelines for each server and the total
    const allPipelines: PipelineWithStats[] = [];

    // Update server pipelines and collect all pipelines
    Object.values(serverGroups).forEach((server) => {
      // Get all pipelines for this server from its workspaces
      server.pipelines = Object.values(server.workspaces).flatMap(
        (workspace) => workspace.pipelines,
      );
      // Add them to the total
      allPipelines.push(...server.pipelines);
    });

    return {
      all: allPipelines,
      automationServers: serverGroups,
      isLoading,
    };
  }, [workspaces, isLoading]);

  return (
    <AutomationsContext.Provider value={automations}>
      {children}
    </AutomationsContext.Provider>
  );
};

export const useAutomations = () => {
  const context = useContext(AutomationsContext);
  if (!context) {
    throw new Error("useAutomations must be used within a AutomationsProvider");
  }
  return context;
};
