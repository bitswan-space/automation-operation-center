import { PipelineDataCard } from "./PipelineDataCard";
import { type PipelineWithStats } from "@/types";

type PipelineDataCardListProps = {
  pipelines?: PipelineWithStats[];
};

export function PipelineDataCardList(
  props: Readonly<PipelineDataCardListProps>,
) {
  const { pipelines } = props;

  return (
    <div className="flex flex-col gap-2 md:pt-2 lg:hidden">
      {pipelines?.map((pipeline) => (
        <div key={pipeline._key}>
          <PipelineDataCard
            id={pipeline.properties["deployment-id"]}
            key={pipeline.properties["container-id"]}
            name={pipeline.properties.name}
            machineName={pipeline.properties["endpoint-name"]}
            dateCreated={pipeline.properties["created-at"]}
            status={pipeline.properties.state}
            uptime={pipeline.properties.status}
            automationServerId={pipeline.automationServerId}
            workspaceId={pipeline.workspaceId}
          />
        </div>
      ))}
    </div>
  );
}
