import { AutomationServerDetailSection } from "@/components/automation-server/AutomationServerDetailSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useEffect, useState } from "react";
import { getAutomationServers } from "@/data/automation-server";
import { fetchOrgGroups } from "@/data/groups";
import { useParams } from "react-router-dom";
import { useTitleBar } from "@/context/TitleBarProvider";
import { Server } from "lucide-react";

const AutomationServerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [automationServer, setAutomationServer] = useState<any>(null);
  const [groupsList, setGroupsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { setTitle, setIcon } = useTitleBar();

  useEffect(() => {
    setTitle("Automation Servers");
    setIcon(<Server size={24} />);
  }, [setTitle, setIcon]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [serversData, groupsData] = await Promise.all([
          getAutomationServers(),
          fetchOrgGroups(),
        ]);

        const server = serversData.results.find(
          (server: any) => server.automation_server_id === id,
        );

        setAutomationServer(server);
        setGroupsList(groupsData.results ?? []);
      } catch (error) {
        console.error("Error loading automation server data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id]);

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
          placeholder="Find automation"
          className="rounded-r-none bg-white"
        />
        <Button type="submit" className="my-auto rounded-l-none bg-stone-800">
          Search
        </Button>
      </div>
      <AutomationServerDetailSection
        server={automationServer}
        groupsList={groupsList}
      />
    </div>
  );
}

export default AutomationServerDetailPage;