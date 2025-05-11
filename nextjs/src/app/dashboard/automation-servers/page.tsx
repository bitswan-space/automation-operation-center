import { AutomationServerListSection } from "@/components/automation-server/AutomationServerListSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React from "react";
import { TitleBar } from "@/components/layout/TitleBar";
import { getAutomationServers } from "@/data/automation-server";
const AutomationServersPage = async () => {
  const automationServers = await getAutomationServers();

  const formattedAutomationServers = automationServers.results.map(
    (server) => ({
      id: server.id,
      name: server.name,
      automation_server_id: server.automation_server_id,
      workspaces: server.workspaces,
      is_connected: true,
      updated_at: server.updated_at,
      created_at: new Date(server.created_at).toTimeString(),
    }),
  );
  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-stone-700 md:hidden">
        Automation Servers
      </h1>
      <TitleBar title="Automation Servers" />
      <div className="flex py-4 pt-6 lg:hidden">
        <Input
          placeholder="Find automation server"
          className="rounded-r-none bg-white"
        />
        <Button type="submit" className="my-auto rounded-l-none bg-stone-800">
          Search
        </Button>
      </div>
      <AutomationServerListSection servers={formattedAutomationServers} />
    </div>
  );
};

export default AutomationServersPage;
