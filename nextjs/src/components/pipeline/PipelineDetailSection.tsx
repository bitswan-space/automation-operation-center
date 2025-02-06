"use client";

import Link from "next/link";
import { PipelineDetailTabs } from "./PipelineDetailTabs";
import React from "react";
import { formatPipelineName } from "@/utils/pipelineUtils";
import { splitArrayUpToElementAndJoin } from "@/utils/arrays";
import { usePipelinesWithStats } from "./hooks/usePipelinesWithStats";

type PipelineDetailSectionProps = {
  ids: string[];
};
export const PipelineDetailSection = (props: PipelineDetailSectionProps) => {
  const { ids } = props;
  const { pipelinesWithStats: pipelines } = usePipelinesWithStats();

  const pipeline = pipelines.find((p) => p._key === ids?.[0]);

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
    <>
      <div className="space-x-4 py-2 text-sm font-semibold text-neutral-600">
        {getBreadcrumbs(ids)}
      </div>
      <div className="h-full py-2">
        <PipelineDetailTabs pipelineParentIDs={ids ?? []} pipeline={pipeline} />
      </div>
    </>
  );
};
