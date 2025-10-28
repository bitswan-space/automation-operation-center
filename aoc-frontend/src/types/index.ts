// Import backend types for enhanced group types
import { type Workspace, type AutomationServer } from '@/data/automation-server';

export type Endpoint = {
  Id: string;
  Name: string;
};

export interface DockerContainer {
  Command: string;
  Created: number;
  HostConfig: HostConfig;
  Id: string;
  Image: string;
  ImageID: string;
  Labels: Labels;
  Mounts: Mount[];
  Names: string[];
  NetworkSettings: NetworkSettings;
  Ports: Port[];
  State: string;
  Status: string;
  IsPortainer?: boolean;
  EndpointName?: string;
}

export interface HostConfig {
  NetworkMode: string;
}

export interface Labels {
  "com.docker.compose.config-hash": string;
  "com.docker.compose.container-number": string;
  "com.docker.compose.depends_on": string;
  "com.docker.compose.image": string;
  "com.docker.compose.oneoff": string;
  "com.docker.compose.project": string;
  "com.docker.compose.project.config_files": string;
  "com.docker.compose.project.working_dir": string;
  "com.docker.compose.replace"?: string;
  "com.docker.compose.service": string;
  "com.docker.compose.version": string;
  "desktop.docker.io/binds/0/Source"?: string;
  "desktop.docker.io/binds/0/SourceKind"?: string;
  "desktop.docker.io/binds/0/Target"?: string;
  "desktop.docker.io/binds/1/Source"?: string;
  "desktop.docker.io/binds/1/SourceKind"?: string;
  "desktop.docker.io/binds/1/Target"?: string;
  "space.bitswan.pipeline.protocol-version"?: string;
  src?: string;
  "com.docker.desktop.extension.api.version"?: string;
  "com.docker.desktop.extension.icon"?: string;
  "com.docker.extension.additional-urls"?: string;
  "com.docker.extension.detailed-description"?: string;
  "com.docker.extension.publisher-url"?: string;
  "com.docker.extension.screenshots"?: string;
  "io.portainer.server"?: string;
  "org.opencontainers.image.description"?: string;
  "org.opencontainers.image.title"?: string;
  "org.opencontainers.image.vendor"?: string;
  "desktop.docker.io/binds/2/Source"?: string;
  "desktop.docker.io/binds/2/SourceKind"?: string;
  "desktop.docker.io/binds/2/Target"?: string;
  "desktop.docker.io/binds/3/Source"?: string;
  "desktop.docker.io/binds/3/SourceKind"?: string;
  "desktop.docker.io/binds/3/Target"?: string;
  "devcontainer.config_file"?: string;
  "devcontainer.local_folder"?: string;
  "devcontainer.metadata"?: string;
}

export interface Mount {
  Destination: string;
  Mode: string;
  Propagation: string;
  RW: boolean;
  Source: string;
  Type: string;
  Driver?: string;
  Name?: string;
}

export interface NetworkSettings {
  Networks: Networks;
}

export interface Networks {
  "low-setup-example-install_default"?: LowSetupExampleInstallDefault;
}

export interface LowSetupExampleInstallDefault {
  Aliases: string[] | null; // TODO: Check returned value
  DriverOpts: null; // TODO: Check returned value
  EndpointID: string;
  Gateway: string;
  GlobalIPv6Address: string;
  GlobalIPv6PrefixLen: number;
  IPAMConfig: null; // TODO: Check returned value
  IPAddress: string;
  IPPrefixLen: number;
  IPv6Gateway: string;
  Links: null; // TODO: Check returned value
  MacAddress: string;
  NetworkID: string;
}

export interface Port {
  PrivatePort: number;
  Type: string;
  IP?: string;
  PublicPort?: number;
}

export type PortainerError = {
  message: string | null;
};

export interface Pipeline {
  id: string;
  name: string;
  machineName: string;
  dateCreated: string;
  upTime: string;
  status: string;
}

export interface PipelineStat {
  result: string;
  table: number;
  _start: string;
  _stop: string;
  _time: string;
  _value: number;
  _field: string;
  _measurement: string;
  appclass: string;
  host: string;
  deployment_id: string;
  pipeline: string;
}

export type PipelineWithStats = PipelineTopology & {
  _key: string;
  pipelineStat: PipelineStat[];
  automationServerId: string;
  automationServerName: string;
  workspaceId: string;
  workspaceName: string;
  vscodeLink?: string; // Computed from editor_url + relative-path
};

export interface PipelineNode {
  id: string;
  type?: string;
  kind?: string;
  capabilities?: string[];
  label?: string;
  disabled?: boolean;
  info?: string;
  pipelineID?: string;
  name?: string;
  props?: Prop[];
  repeat?: string;
  crontab?: string;
  once?: boolean;
  onceDelay?: number;
  topic?: string;
  payload?: string;
  payloadType?: string;
  wires?: string[];
  func?: string;
  outputs?: number;
  timeout?: number;
  noerr?: number;
  initialize?: string;
  finalize?: string;
  properties?: Record<string, unknown>;
  metrics?: unknown[];
  outproperty?: string;
  tag?: string;
  ret?: string;
  as?: string;
}

export interface Prop {
  p: string;
  vt?: string;
}

export interface PumpTopologyResponse {
  timestamp: number;
  data: {
    topology: Record<
      string,
      {
        wires: string[];
        properties: Record<string, unknown>;
        metrics: unknown[];
      }
    >;
  };
  count: number;
  remaining_subscription_count: number;
}

export interface ContainerServiceTopologyResponse {
  timestamp: number;
  data: {
    topology: Topology;
    "display-style": string;
    "display-priority": string;
  };
  count: number;
  remaining_subscription_count: number;
}

export interface WorkspaceTopologyResponse {
  topology: Topology;
  "display-style": string;
  "display-priority": string;
}

export type Topology = Record<string, PipelineTopology>;

export interface PipelineTopology {
  wires: unknown[];
  properties: Properties;
  metrics: unknown[];
}

export interface Properties {
  "endpoint-id": number;
  "container-id": string;
  "endpoint-name": string;
  "deployment-id": string;
  "created-at": Date;
  "automation-url"?: string;
  "relative-path"?: string;
  name: string;
  state: string;
  status: string;
}

export type WorkspaceGroup = {
  workspaceId: string;
  automationServerId: string;
  pipelines: PipelineWithStats[];
  // Full workspace metadata from backend
  workspace: Workspace;
  processes?: Record<string, Process>;
};

export type AutomationServerGroup = {
  serverId: string;
  workspaces: Record<string, WorkspaceGroup>;
  pipelines: PipelineWithStats[];
  // Full automation server metadata from backend
  automationServer: AutomationServer;
};

export type AutomationsGroups = {
  all: PipelineWithStats[];
  processes?: Record<string, Process>;
  automationServers: Record<string, AutomationServerGroup>;
  isLoading: boolean;
};

export type Process = {
  id: string;
  automation_server_id: string;
  workspace_id: string;
  name: string;
  attachments: string[];
  automation_sources: string[];
};
