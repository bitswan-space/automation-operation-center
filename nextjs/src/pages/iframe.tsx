import DashboardLayout from "@/components/layout/DashboardLayout";
import { type NextPageWithLayout } from "./_app";
import { type ReactElement } from "react";
import React from "react";
import { TitleBar } from "@/components/layout/TitleBar";
import type * as next from "next";

interface IframePageProps {
  iframeUrl: string;
  title: string;
}

const IframePage: NextPageWithLayout<IframePageProps> = ({
  iframeUrl,
  title,
}) => {
  return (
    <>
      <div className="h-screen p-4 lg:p-8">
        <h1 className="text-2xl font-bold text-stone-700 md:hidden">{title}</h1>
        <TitleBar title={title} />
        <iframe
          src={iframeUrl}
          title="W3Schools Free Online Web Tutorials"
          className="my-4 h-5/6 w-full rounded-md bg-neutral-800 p-4 font-mono text-xs text-white/90"
        ></iframe>
      </div>
    </>
  );
};

IframePage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export function getServerSideProps(context: next.GetServerSidePropsContext) {
  const { iframeUrl, title } = context.query;

  return {
    props: {
      iframeUrl: iframeUrl ?? "",
      title: title ?? "",
    },
  };
}

export default IframePage;
