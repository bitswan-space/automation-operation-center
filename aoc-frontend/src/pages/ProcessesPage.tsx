import { useEffect } from "react";
import { useTitleBar } from "@/context/TitleBarProvider";
import { Network } from "lucide-react";
import ProcessListSection from "@/components/processes/ProcessListSection";
import { useAutomations } from "@/context/AutomationsProvider";
import AutomateProcessButton from "@/components/processes/AutomateProcessButton";

const ProcessesPage = () => {
  const { setTitle, setIcon, setButtons } = useTitleBar();
  const { processes, all: automations, isLoading } = useAutomations();
  const processList = Object.values(processes);

  useEffect(() => {
    setTitle("Processes");
    setIcon(<Network size={24} />);
    setButtons(<AutomateProcessButton />)
  }, [setTitle, setIcon, setButtons]);

  return (
    <div>
      <ProcessListSection 
        automations={automations}
        processes={processList}
        isLoading={isLoading}
        hideOther={true}
      />
    </div>
  );
};

export default ProcessesPage;
