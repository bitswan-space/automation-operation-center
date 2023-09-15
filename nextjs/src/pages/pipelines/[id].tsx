import {} from "../../components/metrics/charts/EPSSyncAreaChart";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { type NextPageWithLayout } from "../_app";
import { type ReactElement } from "react";
import React from "react";
import { usePipelinesWithStats } from "@/components/pipeline/hooks";
import { TitleBar } from "@/components/layout/TitleBar";
import { useRouter } from "next/router";
import { formatPipelineName } from "@/utils/pipelineUtils";
import Link from "next/link";
import { PipelineDetailTabs } from "../../components/pipeline/PipelineDetailTabs";

const PipelineDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id } = router.query;

  const pipelines = usePipelinesWithStats();
  const pipeline = pipelines.find((p) => p.id === id);

  return (
    <>
      <div className="h-screen p-4 lg:p-8">
        <h1 className="text-2xl font-bold text-stone-700 md:hidden">
          Running Pipelines
        </h1>
        <TitleBar title={"Running Pipelines"} />

        <div className="space-x-4 py-2 text-sm font-semibold text-neutral-600">
          <Link href={"/"} className="underline">
            Running Pipelines
          </Link>
          <span className="text-lg">&#x25B8;</span>
          <span className="underline">
            {formatPipelineName(pipeline?.name ?? "N/A")}
          </span>
        </div>
        <div className="h-full py-2">
          <PipelineDetailTabs pipeline={pipeline} />
        </div>
      </div>
    </>
  );
};

PipelineDetailPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default PipelineDetailPage;
