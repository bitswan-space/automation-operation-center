import { type AutomationServer } from '@/data/automation-server';
import { getAutomationServersAction } from '@/data/automation-servers';
import { type TokenData } from '@/data/mqtt';
import { 
  type PipelineWithStats, 
  type WorkspaceTopologyResponse, 
  type WorkspaceGroup, 
  type AutomationServerGroup, 
  type AutomationsGroups 
} from '@/types';

// Global state that persists across component unmounts
let globalAutomationsState: AutomationsGroups = {
  all: [],
  automationServers: {},
  isLoading: true,
};

let globalWorkspaces: Record<string, WorkspaceGroup> = {};
let globalAutomationServers: Record<string, AutomationServer> = {};
let globalPipelineStats: any[] = [];

// Global MQTT connection manager
class GlobalMQTTManager {
  private connections: Map<string, any> = new Map();
  private subscriptions: Map<string, any> = new Map();
  private isConnected = false;
  private connectionTimeout: NodeJS.Timeout | null = null;

  connect(tokens: TokenData[]) {
    if (this.isConnected) return;
    
    console.log('GlobalMQTTManager: Connecting with tokens:', tokens);
    console.log('GlobalMQTTManager: Token structure:', tokens.map(t => ({
      automation_server_id: t.automation_server_id,
      workspace_id: t.workspace_id,
      token: t.token ? 'present' : 'missing'
    })));
    
    // Clear any existing timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }
    
    // Set loading state
    globalAutomationsState = {
      all: [],
      automationServers: {},
      isLoading: true,
    };
    this.notifyListeners();
    
    // Set a timeout to stop loading after 10 seconds if no data is received
    this.connectionTimeout = setTimeout(() => {
      if (globalAutomationsState.all.length === 0) {
        console.log('GlobalMQTTManager: MQTT connection timeout, stopping loading');
        globalAutomationsState = {
          all: [],
          automationServers: {},
          isLoading: false,
        };
        this.notifyListeners();
      }
    }, 10000);
    
    tokens.forEach((token) => {
      const { automation_server_id, workspace_id } = token;
      const connectionKey = `${automation_server_id}-${workspace_id}`;
      
      if (!this.connections.has(connectionKey)) {
        try {
          // Create MQTT connection for this token
          const connection = this.createMQTTConnection(token);
          this.connections.set(connectionKey, connection);
          
          // Subscribe to topology updates
          const subscription = this.subscribeToTopology(connection, automation_server_id, workspace_id);
          this.subscriptions.set(connectionKey, subscription);
          
          console.log(`GlobalMQTTManager: Connected to ${automation_server_id}/${workspace_id}`);
        } catch (error) {
          console.error(`GlobalMQTTManager: Failed to connect to ${automation_server_id}/${workspace_id}:`, error);
        }
      }
    });
    
    this.isConnected = true;
  }

  private createMQTTConnection(token: TokenData) {
    // Use dynamic host based on current location
    const currentHost = window.location.hostname;
    const protocol = 'wss:';
    
    // Replace subdomain with 'mqtt' for MQTT broker connection
    const mqttHostname = currentHost.replace(/^[^.]+\./, 'mqtt.');
    const mqttHost = `${protocol}//${mqttHostname}/mqtt`;

    // Import mqtt dynamically to avoid SSR issues
    return import('mqtt').then((mqtt) => {
      const client = mqtt.default.connect(mqttHost, {
        clientId: "bitswan-poc" + Math.random().toString(16).substring(2, 8),
        clean: true,
        reconnectPeriod: 60,
        connectTimeout: 30 * 1000,
        username: "bitswan-frontend",
        password: token.token,
      });

      return client;
    });
  }

  private subscribeToTopology(connectionPromise: Promise<any>, automationServerId: string, workspaceId: string) {
    const connectionKey = `${automationServerId}-${workspaceId}`;
    
    connectionPromise.then((client) => {
      client.on("connect", () => {
        console.log("GlobalMQTTManager: Connection successful for", connectionKey);
        
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
            this.handleTopologyMessage(data, automationServerId, workspaceId);
          } catch (error) {
            console.error("GlobalMQTTManager: Failed to parse topology message:", error);
          }
        }
      });
    }).catch((error) => {
      console.error("GlobalMQTTManager: Failed to create MQTT connection:", error);
    });
    
    return {
      unsubscribe: () => {
        console.log(`GlobalMQTTManager: Unsubscribed from ${automationServerId}/${workspaceId}`);
      }
    };
  }

  private handleTopologyMessage(
    workspaceTopology: WorkspaceTopologyResponse,
    automationServerId: string,
    workspaceId: string
  ) {
    console.log('GlobalMQTTManager: Received topology message for', automationServerId, workspaceId);
    
    // Get the automation server and workspace data
    const automationServer = globalAutomationServers[automationServerId];
    const automationServerName = automationServer?.name ?? automationServerId;
    const workspace = automationServer?.workspaces?.find(ws => ws.id === workspaceId);
    const workspaceName = workspace?.name ?? workspaceId;

    // Process pipelines for this workspace
    const workspacePipelines = Object.entries(
      workspaceTopology.topology ?? {},
    ).map(([_, value]) => {
      // Compute vscode link if editor_url and relative-path are available
      let vscodeLink: string | undefined;
      if (workspace?.editor_url && value.properties["relative-path"]) {
        vscodeLink = workspace.editor_url + "?folder=/home/coder/workspace" + 
          `&payload=[["openFile","vscode-remote:///home/coder/workspace/${value.properties["relative-path"]}/main.ipynb"]]`;
      }

      return {
        _key: value.properties["container-id"],
        ...value,
        pipelineStat:
          globalPipelineStats?.filter((stat) =>
            value.properties["deployment-id"].startsWith(stat.deployment_id),
          ) || [],
        automationServerId,
        automationServerName,
        workspaceId,
        workspaceName,
        vscodeLink,
      };
    });

    // Update global workspaces state with full metadata
    globalWorkspaces[workspaceId] = {
      workspaceId,
      automationServerId,
      pipelines: workspacePipelines,
      workspace: workspace!,
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
          const automationServer = globalAutomationServers[automationServerId];
          acc[automationServerId] = {
            serverId: automationServerId,
            workspaces: {},
            pipelines: [],
            automationServer: automationServer!,
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

    // Clear the timeout since we got data
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    // Notify all listeners
    this.notifyListeners();
  }

  private listeners: Set<() => void> = new Set();

  addListener(listener: () => void) {
    this.listeners.add(listener);
  }

  removeListener(listener: () => void) {
    this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  getState(): AutomationsGroups {
    return { ...globalAutomationsState };
  }

  disconnect() {
    this.subscriptions.forEach(subscription => {
      if (subscription.unsubscribe) {
        subscription.unsubscribe();
      }
    });
    this.subscriptions.clear();
    this.connections.clear();

    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    this.isConnected = false;
  }
}

// Create a singleton instance
const globalMQTTManager = new GlobalMQTTManager();

// Service class that manages the persistent MQTT connection
export class MQTTService {
  private static instance: MQTTService;
  private tokens: TokenData[] = [];
  private isInitialized = false;

  private constructor() {}

  static getInstance(): MQTTService {
    if (!MQTTService.instance) {
      MQTTService.instance = new MQTTService();
    }
    return MQTTService.instance;
  }

  async initialize(tokens: TokenData[]) {
    if (this.isInitialized) {
      console.log('MQTTService: Already initialized, updating tokens');
      this.tokens = tokens;
      globalMQTTManager.connect(tokens);
      return;
    }

    console.log('MQTTService: Initializing with tokens:', tokens);
    this.tokens = tokens;
    
    // Fetch automation servers data
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
      console.log('MQTTService: Automation servers fetched:', serversMap);
    } catch (error) {
      console.error("MQTTService: Failed to fetch automation servers:", error);
    }

    // Connect to MQTT
    globalMQTTManager.connect(tokens);
    
    this.isInitialized = true;
  }

  getState(): AutomationsGroups {
    return globalMQTTManager.getState();
  }

  addListener(listener: () => void) {
    globalMQTTManager.addListener(listener);
  }

  removeListener(listener: () => void) {
    globalMQTTManager.removeListener(listener);
  }

  updateTokens(tokens: TokenData[]) {
    this.tokens = tokens;
    if (this.isInitialized) {
      globalMQTTManager.connect(tokens);
    }
  }

  updatePipelineStats(pipelineStats: any[]) {
    globalPipelineStats = pipelineStats;
  }

  disconnect() {
    globalMQTTManager.disconnect();
    this.isInitialized = false;
  }
}

export default MQTTService;
