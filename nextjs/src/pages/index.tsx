import DashboardLayout from "@/components/layout/DashboardLayout";
import { type NextPageWithLayout } from "./_app";
import { type ReactElement } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import React from "react";
import { PipelineDataTable } from "@/components/pipeline/PipelineDataITable";
import { PipelineDataCard } from "@/components/pipeline/PipelineDataCard";
import {
  usePipelineStats,
  usePipelinesWithStats,
} from "@/components/pipeline/hooks";
import { TitleBar } from "../components/layout/TitleBar";

const DashboardPage: NextPageWithLayout = () => {
  const pipelines = usePipelinesWithStats();
  console.log("pipelines", pipelines);

  const _ = usePipelineStats();
  // console.log("stats", stats);

  return (
    <>
      <div className="p-4 lg:p-8">
        <h1 className="text-2xl font-bold text-stone-700 md:hidden">
          Running Pipelines
        </h1>
        <TitleBar title="Running Pipelines" />
        <div className="flex py-4 pt-6 lg:hidden">
          <Input
            placeholder="Find pipeline"
            className="rounded-r-none bg-white"
          />
          <Button type="submit" className="my-auto rounded-l-none bg-stone-800">
            Search
          </Button>
        </div>

        <div className="flex flex-col gap-2 md:pt-2 lg:hidden">
          <PipelineDataCard
            name="Pipeline 1"
            machineName="test_vm"
            dateCreated="2021-08-01"
          />
          <PipelineDataCard
            name="Pipeline 1"
            machineName="test_vm"
            dateCreated="2021-08-01"
          />
        </div>
        <div className="hidden py-4 lg:block">
          <Card
            className={
              "h-full w-full rounded-md border border-slate-300 shadow-sm"
            }
          >
            <CardContent className="p-3">
              <PipelineDataTable pipelines={pipelines} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

DashboardPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default DashboardPage;
