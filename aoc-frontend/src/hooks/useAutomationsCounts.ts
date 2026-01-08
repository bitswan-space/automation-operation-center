import { useAutomations } from "@/context/AutomationsProvider";
import { useEffect, useState } from "react";
import { useWorkspacesQuery } from "./useWorkspacesQuery";
import { useAutomationServersQuery } from "./useAutomationServersQuery";

export function useAutomationsCounts() {
  const { all, processes, isLoading } = useAutomations();
  const [automationCount, setAutomationCount] = useState(0);
  const [runningAutomationCount, setRunningAutomationCount] = useState(0);
  const [processCount, setProcessCount] = useState(0);
  const { data: workspaces } = useWorkspacesQuery();
  const workspaceCount = workspaces?.pages[0]?.count ?? 0;
  const { data: automationServers } = useAutomationServersQuery();
  const automationServerCount = automationServers?.pages[0]?.count ?? 0;
  

  useEffect(() => {
    if (isLoading) {
      return;
    }

    setAutomationCount(all.length);
    setRunningAutomationCount(all.filter(
      (automation) => automation.properties.state === "running").length);
    setProcessCount(Object.keys(processes).length);
  }, [all, automationServers, processes, isLoading]);

  return { 
    automationCount, 
    runningAutomationCount, 
    automationServerCount, 
    workspaceCount, 
    processCount,
    isLoading, 
  };
}
