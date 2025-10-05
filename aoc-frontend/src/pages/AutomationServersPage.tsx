import { AutomationServerListSection } from "@/components/automation-server/AutomationServerListSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useEffect, useState } from "react";
import { useTitleBar } from "@/context/TitleBarProvider";
import { getAutomationServers } from "@/data/automation-server";
import { Server } from "lucide-react";

const AutomationServersPage = () => {
  const [automationServers, setAutomationServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { setTitle, setIcon } = useTitleBar();

  useEffect(() => {
    setTitle("Automation Servers");
    setIcon(<Server size={24} />);
  }, [setTitle, setIcon]);

  useEffect(() => {
    const loadAutomationServers = async () => {
      try {
        const servers = await getAutomationServers();
        const formattedServers = servers.results.map(
          (server: any) => ({
            id: server.id,
            name: server.name,
            automation_server_id: server.automation_server_id,
            workspaces: server.workspaces,
            is_connected: true,
            updated_at: server.updated_at,
            created_at: new Date(server.created_at).toTimeString(),
          }),
        );
        setAutomationServers(formattedServers);
      } catch (error) {
        console.error("Error loading automation servers:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAutomationServers();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-stone-700 md:hidden">
        Automation Servers
      </h1>
      <div className="flex py-4 pt-6 lg:hidden">
        <Input
          placeholder="Find automation server"
          className="rounded-r-none bg-white"
        />
        <Button type="submit" className="my-auto rounded-l-none bg-stone-800">
          Search
        </Button>
      </div>
      <AutomationServerListSection servers={automationServers} />
    </div>
  );
};

export default AutomationServersPage;