"use client";

import { useAutomations } from "@/context/AutomationsProvider";
import { Card, CardContent } from "../ui/card";

import { PipelineDataCardList } from "./PipelineDataCardList";
import { PipelineDataTable } from "./PipelineDataTable";

export function PipelineDataSection() {
  const { all: pipelines, isLoading } = useAutomations();

  console.log("pipelines", pipelines);

  return (
    <>
      <PipelineDataCardList pipelines={pipelines} />
      <div className="hidden py-4 lg:block">
        <Card
          className={
            "h-full w-full rounded-md border border-slate-300 shadow-sm"
          }
        >
          <CardContent className="p-3">
             <PipelineDataTable pipelines={pipelines ?? []} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}