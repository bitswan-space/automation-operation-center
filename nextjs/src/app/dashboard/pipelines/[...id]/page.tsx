"use client";

import Link from "next/link";
import { PipelineDetailTabs } from "@/components/pipeline/PipelineDetailTabs";
import React, { use } from "react";
import { TitleBar } from "@/components/layout/TitleBar";
import { formatPipelineName } from "@/utils/pipelineUtils";
import { splitArrayUpToElementAndJoin } from "@/utils/arrays";
import { usePipelinesWithStats } from "@/components/pipeline/hooks/usePipelinesWithStats";

const PipelineDetailPage = (props: { params: Promise<{ id: string[] }> }) => {
  const params = use(props.params);
  const { pipelinesWithStats: pipelines } = usePipelinesWithStats();

  const pipeline = pipelines.find((p) => p._key === params.id?.[0]);

  const getBreadcrumbs = (pipelineIDs: string[]) => {
    return pipelineIDs.map((id, index) => {
      if (index === 0) {
        return (
          <React.Fragment key={id}>
            <Link href={"/dashboard/pipelines"} className="underline">
              Pipeline Containers
            </Link>
            <span className="text-lg">&#x25B8;</span>
            <Link href={`/dashboard/pipelines/${id}`} className="underline">
              {formatPipelineName(pipeline?.properties.name ?? "N/A")}
            </Link>
          </React.Fragment>
        );
      }

      return (
        <React.Fragment key={id}>
          <span className="text-lg">&#x25B8;</span>
          <Link
            href={`/pipelines/${splitArrayUpToElementAndJoin<string>(
              pipelineIDs,
              id,
            )}`}
            className="underline"
          >
            {id}
          </Link>
        </React.Fragment>
      );
    });
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-stone-700 md:hidden">
        Pipeline Container
      </h1>
      <TitleBar title={"Pipeline Container"} />
      <div className="space-x-4 py-2 text-sm font-semibold text-neutral-600">
        {getBreadcrumbs(params.id)}
      </div>
      <div className="h-full py-2">
        <PipelineDetailTabs
          pipelineParentIDs={params.id ?? []}
          pipeline={pipeline}
        />
      </div>
      `
    </div>
  );
};

export default PipelineDetailPage;
