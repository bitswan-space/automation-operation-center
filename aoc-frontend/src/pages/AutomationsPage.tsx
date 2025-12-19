import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PipelineDataSection } from "@/components/pipeline/PipelineDataSection";
import React, { useEffect } from "react";
import { useTitleBar } from "@/context/TitleBarProvider";
import { Cog } from "lucide-react";
import AutomateProcessButton from "@/components/processes/AutomateProcessButton";

const AutomationsPage = () => {
  const { setTitle, setIcon, setButtons } = useTitleBar();

  useEffect(() => {
    setTitle("Automations");
    setIcon(<Cog size={24} />);
    setButtons(<AutomateProcessButton />)
  }, [setTitle, setIcon, setButtons]);

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-stone-700 md:hidden">
        Automations
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

      <PipelineDataSection />
    </div>
  );
};

export default AutomationsPage;
