import { AutomationServerDetailSection } from "@/components/automation-server/AutomationServerDetailSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTitleBar } from "@/context/TitleBarProvider";
import { Server } from "lucide-react";
import { useAutomationServersQuery } from "@/hooks/useAutomationServersQuery";

const AutomationServerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: automationServersData } = useAutomationServersQuery();
  const { setTitle, setIcon, setButtons } = useTitleBar();

  useEffect(() => {
    setTitle("Automation Servers");
    setIcon(<Server size={24} />);
    setButtons(null)
  }, [setTitle, setIcon, setButtons]);

  const automationServer = automationServersData?.pages.flatMap((page) => page.results).find(
    (server) => server.automation_server_id === id,
  );

  if (!automationServer) {
    return <div>Automation server not found</div>;
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
      />
    </div>
  );
}

export default AutomationServerDetailPage;