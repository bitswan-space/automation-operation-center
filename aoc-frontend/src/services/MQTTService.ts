import { type AutomationServer } from '@/data/automation-server';
import { getAutomationServersAction } from '@/data/automation-servers';
import { type TokenData } from '@/data/mqtt';
import { 
  type PipelineWithStats, 
  type WorkspaceTopologyResponse, 
  type WorkspaceGroup, 
  type AutomationServerGroup, 
  type AutomationsGroups,
  type Process,
} from '@/types';
import { type MqttClient } from 'mqtt';

// Global state that persists across component unmounts
let globalAutomationsState: AutomationsGroups = {
  all: [],
  processes: {},
  automationServers: {},
  isLoading: true,
};

let globalWorkspaces: Record<string, WorkspaceGroup> = {};
let globalAutomationServers: Record<string, AutomationServer> = {};
let globalPipelineStats: any[] = [];

// Global MQTT connection manager
class GlobalMQTTManager {
  private connections: Map<string, Promise<MqttClient> | MqttClient> = new Map();
  private topologySubscriptions: Map<string, any> = new Map();
  private processesSubscriptions: Map<string, any> = new Map();
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
      processes: {},
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
          processes: {},
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
          const topologySubscription = this.subscribeToTopology(connection, automation_server_id, workspace_id);
          this.topologySubscriptions.set(connectionKey, topologySubscription);
          
          // Subscribe to processes updates
          const processesSubscription = this.subscribeToProcesses(connection, automation_server_id, workspace_id);
          this.processesSubscriptions.set(connectionKey, processesSubscription);
          
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
        this.topologySubscriptions.set(connectionKey, { requestTopic, responseTopic });
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
      processes: globalWorkspaces[workspaceId]?.processes ?? {},
    };

    // Update global automations state
    this.updateGlobalAutomationsState();
  }

  private subscribeToProcesses(connectionPromise: Promise<MqttClient>, automationServerId: string, workspaceId: string) {
    const connectionKey = `${automationServerId}-${workspaceId}`;
    console.log("GlobalMQTTManager: Subscribing to processes for", connectionKey);
    connectionPromise.then((client) => {
      client.on("connect", () => {
        console.log("GlobalMQTTManager: Connection successful for", connectionKey);
        client.subscribe(`/processes/list`, { qos: 0 });
      });

      client.on("error", (err) => {
        console.error("GlobalMQTTManager: Connection error:", err);
      });

      client.on("message", (topic, message) => {
        if (topic === `/processes/list`) {
          try {
            const data = JSON.parse(message.toString()) as { processes: Record<string, Process> };
            this.handleProcessMessage(data.processes, automationServerId, workspaceId);
          } catch (error) {
            console.error("GlobalMQTTManager: Failed to parse processes message:", error);
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

  private handleProcessMessage(processes: Record<string, Process>, automationServerId: string, workspaceId: string) {
    
    // Handle case where workspace doesn't exist yet (processes arrive before topology)
    if (!globalWorkspaces[workspaceId]) {
      console.warn(`Workspace ${workspaceId} not found when handling process message. Creating placeholder.`);
      // Get the automation server data if available
      const automationServer = globalAutomationServers[automationServerId];
      const workspace = automationServer?.workspaces?.find(ws => ws.id === workspaceId);
      
      globalWorkspaces[workspaceId] = {
        workspaceId,
        automationServerId,
        pipelines: [],
        workspace: workspace || {
          id: workspaceId,
          name: workspaceId,
          keycloak_org_id: '',
          automation_server: automationServerId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          editor_url: null,
        },
        processes: {},
      };
    }
    
    Object.entries(processes).forEach(([processId, process]) => {
      process.automation_server_id = automationServerId;
      process.workspace_id = workspaceId;
    });

    globalWorkspaces[workspaceId].processes = processes;
    
    // Notify listeners that processes have been updated
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
    
    // Aggregate all processes from all workspaces into globalAutomationsState.processes
    const allProcesses = Object.values(globalWorkspaces).reduce(
      (acc, workspace) => {
        if (workspace.processes) {
          Object.assign(acc, workspace.processes);
        }
        return acc;
      },
      {} as Record<string, Process>
    );

    globalAutomationsState = {
      all: allPipelines,
      processes: allProcesses,
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

  // Helper method to get the client, handling both Promise and actual client
  private async getClient(automationServerId: string, workspaceId: string): Promise<MqttClient | null> {
    const connection = this.connections.get(`${automationServerId}-${workspaceId}`);
    if (!connection) return Promise.resolve(null);
    
    // If it's already a client, return it directly as a resolved Promise
    if ('publish' in connection && typeof (connection as any).publish === 'function') {
      return Promise.resolve(connection as MqttClient);
    }
    
    // Otherwise it's a Promise, return it
    return connection as Promise<MqttClient>;
  }

  createProcess(processName: string, workspaceId: string, automationServerId: string) {
    const processId = crypto.randomUUID();
    
    this.getClient(automationServerId, workspaceId).then(client => {
      if (client) {
        client.publish(`/processes/c/${processId}/create`, JSON.stringify({ name: processName }), { qos: 0 });
      }
    }).catch((error) => {
      console.error("GlobalMQTTManager: Failed to create process:", error);
    });
    
    return processId;
  }

  deleteProcess(processId: string, workspaceId: string, automationServerId: string) {
    this.getClient(automationServerId, workspaceId).then(client => {
      if (client) {
        client.publish(`/processes/c/${processId}/gitops-req`, JSON.stringify({ action: "delete" }), { qos: 0 });
      }
    }).catch((error) => {
      console.error("GlobalMQTTManager: Failed to delete process:", error);
    });
    return true;
  }

  async getProcessContent(processId: string, workspaceId: string, automationServerId: string): Promise<string | null> {
    try {
      const mqttClient = await this.getClient(automationServerId, workspaceId);
      
      if (!mqttClient) return null;
      
      return new Promise((resolve, reject) => {
        const messageHandler = (topic: string, message: Buffer) => {
          if (topic === `/processes/c/${processId}/contents`) {
            try {
              // Clean up subscription and listener
              mqttClient.unsubscribe(`/processes/c/${processId}/contents`);
              mqttClient.removeListener("message", messageHandler);
              
              const data = JSON.parse(message.toString()) as { content: string };
              resolve(data.content);
            } catch (error) {
              mqttClient.unsubscribe(`/processes/c/${processId}/contents`);
              mqttClient.removeListener("message", messageHandler);
              reject(error);
            }
          }
        };
        
        // Subscribe first
        mqttClient.subscribe(`/processes/c/${processId}/contents`, { qos: 1 });
        
        // Add message listener
        mqttClient.on("message", messageHandler);
        
        // Publish the request
        mqttClient.publish(`/processes/c/${processId}/gitops-req`, JSON.stringify({ action: "get" }), { qos: 0 });
        
        // Set timeout to avoid hanging forever
        setTimeout(() => {
          mqttClient.unsubscribe(`/processes/c/${processId}/contents`);
          mqttClient.removeListener("message", messageHandler);
          reject(new Error("Timeout waiting for response"));
        }, 10000); // 10 second timeout
      });
    } catch (error) {
      console.error("GlobalMQTTManager: Failed to get process content:", error);
      return null;
    }
  }

  setProcessContent(processId: string, content: string, workspaceId: string, automationServerId: string) {
    this.getClient(automationServerId, workspaceId).then(client => {
      if (client) {
        client.publish(`/processes/c/${processId}/set`, JSON.stringify({ content: content }), { qos: 1 });
      }
    }).catch((error) => {
      console.error("GlobalMQTTManager: Failed to set process content:", error);
    });
    return true;
  }

  deleteProcessAttachment(processId: string, fileName: string, workspaceId: string, automationServerId: string) {
    this.getClient(automationServerId, workspaceId).then(client => {
      if (client) {
        client.publish(`/processes/c/${processId}/attachments/c/${fileName}/gitops-req`, JSON.stringify({ action: "delete" }), { qos: 0 });
      }
    }).catch((error) => {
      console.error("GlobalMQTTManager: Failed to delete process attachment:", error);
    });
    return true;
  }

  async getProcessAttachment(processId: string, fileName: string, workspaceId: string, automationServerId: string): Promise<Blob | null> {
    try {
      const mqttClient = await this.getClient(automationServerId, workspaceId);
      
      if (!mqttClient) return null;
      
      return new Promise((resolve, reject) => {
        const messageHandler = (topic: string, message: Buffer) => {
          if (topic === `/processes/c/${processId}/attachments/c/${fileName}/contents`) {
            try {
              // Clean up subscription and listener
              mqttClient.unsubscribe(`/processes/c/${processId}/attachments/c/${fileName}/contents`);
              mqttClient.removeListener("message", messageHandler);
              
              // Python publishes raw binary content, not JSON
              // Convert Buffer to Uint8Array for Blob
              const uint8Array = new Uint8Array(message);
              resolve(new Blob([uint8Array]));
            } catch (error) {
              mqttClient.unsubscribe(`/processes/c/${processId}/attachments/c/${fileName}/contents`);
              mqttClient.removeListener("message", messageHandler);
              reject(error);
            }
          }
        };
        
        // Subscribe first
        mqttClient.subscribe(`/processes/c/${processId}/attachments/c/${fileName}/contents`, { qos: 1 });
        
        // Add message listener
        mqttClient.on("message", messageHandler);
        
        // Publish the request
        mqttClient.publish(`/processes/c/${processId}/attachments/c/${fileName}/gitops-req`, JSON.stringify({ action: "get" }), { qos: 0 });
        
        // Set timeout to avoid hanging forever
        setTimeout(() => {
          mqttClient.unsubscribe(`/processes/c/${processId}/attachments/c/${fileName}/contents`);
          mqttClient.removeListener("message", messageHandler);
          reject(new Error("Timeout waiting for response"));
        }, 10000); // 10 second timeout
      });
    } catch (error) {
      console.error("GlobalMQTTManager: Failed to get process content:", error);
      return null;
    }
  }

  async setProcessAttachment(processId: string, fileName: string, file: File, workspaceId: string, automationServerId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Read file as base64 string
      const reader = new FileReader();
      reader.onload = () => {
        const base64Content = reader.result as string;
        // Remove data URL prefix if present
        const content = base64Content.includes(',') ? base64Content.split(',')[1] : base64Content;
        
        this.getClient(automationServerId, workspaceId).then(client => {
          if (client) {
            client.publish(`/processes/c/${processId}/attachments/c/${fileName}/set`, JSON.stringify({ content: content }), { qos: 1 });
            resolve(true);
          } else {
            reject(new Error("Client not available"));
          }
        }).catch((error) => {
          console.error("GlobalMQTTManager: Failed to set process attachment:", error);
          reject(error);
        });
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  }

  disconnect() {
    this.topologySubscriptions.forEach(subscription => {
      if (subscription.unsubscribe) {
        subscription.unsubscribe();
      }
    });
    this.topologySubscriptions.clear();

    this.processesSubscriptions.forEach(subscription => {
      if (subscription.unsubscribe) {
        subscription.unsubscribe();
      }
    });
    this.processesSubscriptions.clear();

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

  createProcess(processName: string, workspaceId: string, automationServerId: string) {
    return globalMQTTManager.createProcess(processName, workspaceId, automationServerId);
  }

  deleteProcess(processId: string, workspaceId: string, automationServerId: string) {
    return globalMQTTManager.deleteProcess(processId, workspaceId, automationServerId);
  }

  getProcessContent(processId: string, workspaceId: string, automationServerId: string): Promise<string | null> {
    return globalMQTTManager.getProcessContent(processId, workspaceId, automationServerId);
  }

  setProcessContent(processId: string, content: string, workspaceId: string, automationServerId: string) {
    return globalMQTTManager.setProcessContent(processId, content, workspaceId, automationServerId);
  }

  deleteProcessAttachment(processId: string, fileName: string, workspaceId: string, automationServerId: string) {
    return globalMQTTManager.deleteProcessAttachment(processId, fileName, workspaceId, automationServerId);
  }

  getProcessAttachment(processId: string, fileName: string, workspaceId: string, automationServerId: string): Promise<Blob | null> {
    return globalMQTTManager.getProcessAttachment(processId, fileName, workspaceId, automationServerId);
  }

  setProcessAttachment(processId: string, fileName: string, file: File, workspaceId: string, automationServerId: string) {
    return globalMQTTManager.setProcessAttachment(processId, fileName, file, workspaceId, automationServerId);
  }

  disconnect() {
    globalMQTTManager.disconnect();
    this.isInitialized = false;
  }
}

export default MQTTService;
