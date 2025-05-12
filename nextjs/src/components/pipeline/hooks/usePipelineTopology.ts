import { useMQTTRequestResponse } from "@/shared/hooks/useMQTTRequestResponse";
import { type PumpTopologyResponse } from "@/types";
import { flattenTopology, joinIDsWithDelimiter } from "@/utils/pipelineUtils";

type UsePipelineTopologyProps = {
  automationServerId: string;
  workspaceId: string;
  componentIDs: string[];
};

export const usePipelineTopology = (props: UsePipelineTopologyProps) => {
  const { automationServerId, workspaceId, componentIDs } = props;

  const pipelineTopologyRequestTopic = `/automation-servers/${automationServerId}/c/${workspaceId}${joinIDsWithDelimiter(
    componentIDs,
    "/",
  )}/topology/subscribe`;

  const pipelineTopologyResponseTopic = `/automation-servers/${automationServerId}/c/${workspaceId}${joinIDsWithDelimiter(
    componentIDs,
    "/",
  )}/topology`;

  const { response: topology } = useMQTTRequestResponse<PumpTopologyResponse>({
    requestTopic: pipelineTopologyRequestTopic,
    responseTopic: pipelineTopologyResponseTopic,
  });

  const pipelineTopology = flattenTopology(topology);

  return { pipelineTopology };
};
