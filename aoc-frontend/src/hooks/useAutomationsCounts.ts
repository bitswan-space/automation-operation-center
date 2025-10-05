import { useAutomations } from "@/context/AutomationsProvider";
import { useEffect, useState } from "react";

export function useAutomationsCounts() {
  const { all, automationServers, isLoading } = useAutomations();
  const [automationCount, setAutomationCount] = useState(0);
  const [runningAutomationCount, setRunningAutomationCount] = useState(0);
  const [pausedAutomationCount, setPausedAutomationCount] = useState(0);
  const [automationServerCount, setAutomationServerCount] = useState(0);
  const [workspaceCount, setWorkspaceCount] = useState(0);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    setAutomationCount(all.length);
    setRunningAutomationCount(all.filter(
      (automation) => automation.properties.state === "running").length);
    setPausedAutomationCount(all.filter(
      (automation) => automation.properties.state === "stopped").length);
    setAutomationServerCount(Object.keys(automationServers).length);
    setWorkspaceCount(Object.values(automationServers).reduce(
        (acc, server) => acc + Object.keys(server.workspaces).length, 0));
  }, [all, automationServers, isLoading]);

  return { 
    automationCount, 
    runningAutomationCount, 
    pausedAutomationCount, 
    automationServerCount, 
    workspaceCount, 
    isLoading, 
  };
}
