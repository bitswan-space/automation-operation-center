import { AutomationServerDetailSection } from "@/components/automation-server/AutomationServerDetailSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React from "react";
import { TitleBar } from "@/components/layout/TitleBar";
import { getAutomationServers } from "@/data/automation-server";

const AutomationServersPage = async (props: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await props.params;
  const automationServers = await getAutomationServers();

  const automationServer = automationServers.results.find(
    (server) => server.automation_server_id === id,
  );

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-stone-700 md:hidden">
        Automation Servers
      </h1>
      <TitleBar title="Automation Servers" />
      <div className="flex py-4 pt-6 lg:hidden">
        <Input
          placeholder="Find automation"
          className="rounded-r-none bg-white"
        />
        <Button type="submit" className="my-auto rounded-l-none bg-stone-800">
          Search
        </Button>
      </div>
      <AutomationServerDetailSection server={automationServer} />
    </div>
  );
};

export default AutomationServersPage;
