"use client";

import { useAutomations } from "@/context/AutomationsProvider";
import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

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
            {isLoading ?
             <div className="flex flex-col gap-4">
               <Skeleton className="h-8 max-w-sm" />
               <div className="flex flex-col gap-2 border rounded-md p-4">
                 <span className="flex flex-row bg-stone-100/70">
                   <Skeleton className="h-7 w-full" />
                 </span>
                 <span className="flex flex-row gap-2">
                   <Skeleton className="h-6 w-1/6" />
                   <Skeleton className="h-6 w-1/6" />
                   <Skeleton className="h-6 w-1/6" />
                   <Skeleton className="h-6 w-1/6" />
                   <Skeleton className="h-6 w-1/6" />
                   <Skeleton className="h-6 w-1/6" />
                  </span>
                  <span className="flex flex-row gap-2">
                   <Skeleton className="h-6 w-1/6" />
                   <Skeleton className="h-6 w-1/6" />
                   <Skeleton className="h-6 w-1/6" />
                   <Skeleton className="h-6 w-1/6" />
                   <Skeleton className="h-6 w-1/6" />
                   <Skeleton className="h-6 w-1/6" />
                  </span>
               </div>
             </div> : 
             <PipelineDataTable pipelines={pipelines ?? []} />}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
