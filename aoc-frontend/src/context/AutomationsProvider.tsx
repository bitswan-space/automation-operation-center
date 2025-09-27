import React, { createContext, useContext, useRef, useState, useEffect, ReactNode } from 'react';
import { useMQTTRequestResponse } from '@/shared/hooks/useMQTTRequestResponse';
import { usePipelineStats } from '@/components/pipeline/hooks/usePipelineStats';
import { type AutomationServer } from '@/data/automation-server';
import { getAutomationServersAction } from '@/data/automation-servers';
import { type TokenData } from '@/data/mqtt';
import { type PipelineWithStats, type WorkspaceTopologyResponse } from '@/types';

type WorkspaceGroup = {
  workspaceId: string;
  automationServerId: string;
  pipelines: PipelineWithStats[];
};

type AutomationServerGroup = {
  serverId: string;
  workspaces: Record<string, WorkspaceGroup>;
  pipelines: PipelineWithStats[];
};

type AutomationsGroups = {
  all: PipelineWithStats[];
  automationServers: Record<string, AutomationServerGroup>;
  isLoading: boolean;
};

// Global state that persists across component unmounts
let globalAutomationsState: AutomationsGroups = {
  all: [],
  automationServers: {},
  isLoading: true,
};

let globalWorkspaces: Record<string, WorkspaceGroup> = {};
let globalAutomationServers: Record<string, AutomationServer> = {};
let globalAutomationServersAreFetched = false;
let globalPipelineStats: any[] = [];

// Global MQTT connection manager
class GlobalMQTTManager {
  private connections: Map<string, any> = new Map();
  private subscriptions: Map<string, any> = new Map();
  private isConnected = false;

  connect(tokens: TokenData[]) {
    if (this.isConnected) return;
    
    console.log('GlobalMQTTManager: Connecting with tokens:', tokens);
    
    tokens.forEach(tokenData => {
      if (!tokenData.token || !tokenData.automation_server_id || !tokenData.workspace_id) {
        console.warn("Invalid token data, skipping MQTT connection:", tokenData);
        return;
      }

      const connectionKey = `${tokenData.automation_server_id}-${tokenData.workspace_id}`;
      
      if (this.connections.has(connectionKey)) {
        console.log('GlobalMQTTManager: Connection already exists for:', connectionKey);
        return;
      }

      console.log("GlobalMQTTManager: Connecting to MQTT with token for server:", tokenData.automation_server_id);
      
      // Use dynamic host based on current location
      const currentHost = window.location.hostname;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      
      // Replace subdomain with 'mqtt' for MQTT broker connection
      const mqttHostname = currentHost.replace(/^[^.]+\./, 'mqtt.');
      const mqttHost = `${protocol}//${mqttHostname}/mqtt`;

      // Import mqtt dynamically to avoid SSR issues
      import('mqtt').then((mqtt) => {
        const client = mqtt.default.connect(mqttHost, {
          clientId: "bitswan-poc" + Math.random().toString(16).substring(2, 8),
          clean: true,
          reconnectPeriod: 60,
          connectTimeout: 30 * 1000,
          username: "bitswan-frontend",
          password: tokenData.token,
        });

        client.on("connect", () => {
          console.log("GlobalMQTTManager: Connection successful for", connectionKey);
          this.isConnected = true;
          
          // Subscribe to topology
          const requestTopic = `/topology/subscribe`;
          const responseTopic = `/topology`;
          
          client.publish(requestTopic, JSON.stringify({ count: 1 }), { qos: 0 });
          client.subscribe(responseTopic, { qos: 0 });
          
          this.connections.set(connectionKey, client);
          this.subscriptions.set(connectionKey, { requestTopic, responseTopic });
        });

        client.on("error", (err) => {
          console.error("GlobalMQTTManager: Connection error:", err);
        });

        client.on("message", (topic, message) => {
          if (topic === `/topology`) {
            try {
              const data = JSON.parse(message.toString()) as WorkspaceTopologyResponse;
              this.handleTopologyMessage(data, tokenData.automation_server_id, tokenData.workspace_id);
            } catch (error) {
              console.error("GlobalMQTTManager: Failed to parse topology message:", error);
            }
          }
        });
      });
    });
  }

  private handleTopologyMessage(
    workspaceTopology: WorkspaceTopologyResponse,
    automationServerId: string,
    workspaceId: string
  ) {
    console.log('GlobalMQTTManager: Received topology message for', automationServerId, workspaceId);
    
    // Get the automation server name
    const automationServer = globalAutomationServers[automationServerId];
    const automationServerName = automationServer?.name ?? automationServerId;

    // Process pipelines for this workspace
    const workspacePipelines = Object.entries(
      workspaceTopology.topology ?? {},
    ).map(([_, value]) => ({
      _key: value.properties["container-id"],
      ...value,
      pipelineStat:
        globalPipelineStats?.filter((stat) =>
          value.properties["deployment-id"].startsWith(stat.deployment_id),
        ) || [],
      automationServerId,
      automationServerName,
      workspaceId,
    }));

    // Update global workspaces state
    globalWorkspaces[workspaceId] = {
      workspaceId,
      automationServerId,
      pipelines: workspacePipelines,
    };

    // Update global automations state
    this.updateGlobalAutomationsState();
  }

  private updateGlobalAutomationsState() {
    // First, group workspaces by server to build the server structure
    const serverGroups = Object.values(globalWorkspaces).reduce(
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

    globalAutomationsState = {
      all: allPipelines,
      automationServers: serverGroups,
      isLoading: false,
    };

    // Notify all listeners
    this.notifyListeners();
  }

  private listeners: Set<() => void> = new Set();

  addListener(callback: () => void) {
    this.listeners.add(callback);
  }

  removeListener(callback: () => void) {
    this.listeners.delete(callback);
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback());
  }

  disconnect() {
    this.connections.forEach((client) => {
      client.end();
    });
    this.connections.clear();
    this.subscriptions.clear();
    this.isConnected = false;
  }
}

const globalMQTTManager = new GlobalMQTTManager();

const AutomationsContext = createContext<AutomationsGroups | null>(null);

export const AutomationsProvider = ({ children, tokens }: { children: ReactNode, tokens: TokenData[] }) => {
  const [automations, setAutomations] = useState<AutomationsGroups>(globalAutomationsState);
  const pipelineStats = usePipelineStats();

  // Update global pipeline stats
  useEffect(() => {
    globalPipelineStats = pipelineStats;
  }, [pipelineStats]);

  // Fetch automation servers data (only once)
  useEffect(() => {
    if (globalAutomationServersAreFetched) return;

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
        globalAutomationServers = serversMap;
        globalAutomationServersAreFetched = true;
        console.log('GlobalMQTTManager: Automation servers fetched:', serversMap);
      } catch (error) {
        globalAutomationServersAreFetched = true;
        console.error("Failed to fetch automation servers:", error);
      }
    };

    void fetchAutomationServers();
  }, []);

  // Connect to MQTT when tokens are available
  useEffect(() => {
    if (tokens && tokens.length > 0) {
      console.log('AutomationsProvider: Connecting to MQTT with tokens:', tokens);
      globalMQTTManager.connect(tokens);
    }
  }, [tokens]);

  // Listen for global state changes
  useEffect(() => {
    const handleStateChange = () => {
      setAutomations({ ...globalAutomationsState });
    };

    globalMQTTManager.addListener(handleStateChange);
    
    // Set initial state
    handleStateChange();

    return () => {
      globalMQTTManager.removeListener(handleStateChange);
    };
  }, []);

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