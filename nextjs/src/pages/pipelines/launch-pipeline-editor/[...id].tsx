import {} from "../../../components/metrics/charts/EPSSyncAreaChart";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { type NextPageWithLayout } from "../../_app";
import { type ReactElement } from "react";
import React from "react";

import { TitleBar } from "@/components/layout/TitleBar";
import { formatPipelineName } from "@/utils/pipelineUtils";
import Link from "next/link";
import type * as next from "next";
import { splitArrayUpToElementAndJoin } from "@/utils/arrays";
import { useMQTTRequestResponse } from "@/shared/hooks/useMQTTRequestResponse";
import { usePipelinesWithStats } from "@/components/pipeline/hooks/usePipelinesWithStats";

interface PipelineEditorLaunchPageProps {
  id: string;
}

const PipelineEditorLaunchPage: NextPageWithLayout<
  PipelineEditorLaunchPageProps
> = ({ id }) => {
  const { pipelinesWithStats: pipelines } = usePipelinesWithStats();
  const pipeline = pipelines.find((p) => p._key === id?.[0]);

  const [logMessages, setLogMessages] = React.useState<string[]>([]);

  const [redirectParams, setRedirectParams] =
    React.useState<PipelineEditorRedirectResponse>();

  console.log("logMessages", logMessages);

  type PipelineEditorLaunchResponse = {
    message: string;
  };

  type PipelineEditorRedirectResponse = {
    redirect: boolean;
    url: string;
  };

  const { response: logMessage } =
    useMQTTRequestResponse<PipelineEditorLaunchResponse>({
      requestTopic: `${id}/editor/launch/subscribe`,
      responseTopic: `${id}/editor/launch`,
    });

  React.useEffect(() => {
    if (logMessage) {
      setLogMessages((prev) => [...prev, logMessage.message]);
    }
  }, [logMessage]);

  const { response: redirectRes } =
    useMQTTRequestResponse<PipelineEditorRedirectResponse>({
      responseTopic: `${id}/editor/redirect`,
      requestTopic: `${id}/editor/redirect/subscribe`,
    });

  React.useEffect(() => {
    if (redirectRes) {
      setRedirectParams(redirectRes);
    }
  }, [redirectRes]);

  React.useEffect(() => {
    console.log("redirectParams", redirectParams);
    const { redirect, url } = redirectParams ?? {};
    if (redirect && url) {
      window.open(url, "_blank");
    }
  }, [redirectParams]);

  const getBreadcrumbs = (pipelineIDs: string[]) => {
    return pipelineIDs.map((id, index) => {
      if (index === 0) {
        return (
          <React.Fragment key={id}>
            <Link href={"/"} className="underline">
              Running Pipelines
            </Link>
            <span className="text-lg">&#x25B8;</span>
            <Link href={`/pipelines/${id}`} className="underline">
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
    <div className="h-screen p-4 lg:p-8">
      <h1 className="text-2xl font-bold text-stone-700 md:hidden">
        Launching Pipeline Editor ...
      </h1>
      <TitleBar title={"Launching Pipeline Editor ..."} />

      <div className="space-x-4 py-4 text-sm font-semibold text-neutral-600">
        {getBreadcrumbs([id])}
      </div>
      <div className="h-5/6 overflow-auto overflow-y-scroll rounded-md bg-black/90 p-4 font-mono text-xs text-white/90">
        <ul className=" space-y-2">
          {logMessages.map((log) => (
            <li key={log}>{log}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

PipelineEditorLaunchPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export function getServerSideProps(context: next.GetServerSidePropsContext) {
  const { id } = context.query;

  const pipelineId = id as string;

  return {
    props: {
      id: pipelineId,
    },
  };
}

export default PipelineEditorLaunchPage;
