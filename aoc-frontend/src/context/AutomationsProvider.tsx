import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePipelineStats } from '@/components/pipeline/hooks/usePipelineStats';
import { type TokenData } from '@/data/mqtt';
import { type PipelineWithStats } from '@/types';
import MQTTService from '@/services/MQTTService';

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

// Global pipeline stats for the service
let globalPipelineStats: any[] = [];

const AutomationsContext = createContext<AutomationsGroups | null>(null);

export const AutomationsProvider = ({ children, tokens }: { children: ReactNode, tokens: TokenData[] }) => {
  const [automations, setAutomations] = useState<AutomationsGroups>(() => MQTTService.getInstance().getState());
  const pipelineStats = usePipelineStats();

  // Update global pipeline stats
  useEffect(() => {
    globalPipelineStats = pipelineStats;
  }, [pipelineStats]);

  // Initialize MQTT service when tokens are available
  useEffect(() => {
    if (tokens && tokens.length > 0) {
      console.log('AutomationsProvider: Initializing MQTT service with tokens:', tokens);
      MQTTService.getInstance().initialize(tokens);
    } else if (tokens && tokens.length === 0) {
      console.log('AutomationsProvider: No MQTT tokens available');
      MQTTService.getInstance().updateTokens([]);
    }
  }, [tokens]);

  // Listen for state changes from the persistent MQTT service
  useEffect(() => {
    const handleStateChange = () => {
      const newState = MQTTService.getInstance().getState();
      setAutomations(newState);
    };

    MQTTService.getInstance().addListener(handleStateChange);
    
    // Set initial state
    handleStateChange();

    return () => {
      MQTTService.getInstance().removeListener(handleStateChange);
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