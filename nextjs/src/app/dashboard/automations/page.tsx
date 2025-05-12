import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PipelineDataSection } from "@/components/pipeline/PipelineDataSection";
import React from "react";
import { TitleBar } from "@/components/layout/TitleBar";

const DashboardPage = () => {
  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-stone-700 md:hidden">
        Automations
      </h1>
      <TitleBar title="Automations" />
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

export default DashboardPage;
