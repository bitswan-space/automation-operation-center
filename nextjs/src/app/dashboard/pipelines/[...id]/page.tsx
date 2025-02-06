import React, { use } from "react";

import { PipelineDetailSection } from "@/components/pipeline/PipelineDetailSection";
import { TitleBar } from "@/components/layout/TitleBar";

const PipelineDetailPage = (props: { params: Promise<{ id: string[] }> }) => {
  const params = use(props.params);

  const ids = params.id;

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-stone-700 md:hidden">
        Pipeline Container
      </h1>
      <TitleBar title={"Pipeline Container"} />
      <PipelineDetailSection ids={ids} />
    </div>
  );
};

export default PipelineDetailPage;
