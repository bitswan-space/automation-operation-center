import { useMQTTRequestResponse } from "@/shared/hooks/useMQTTRequestResponse";
import { type PumpTopologyResponse } from "@/types";
import { flattenTopology, joinIDsWithDelimiter } from "@/utils/pipelineUtils";

type UsePipelineTopologyProps = {
  componentIDs: string[];
};

export const usePipelineTopology = (props: UsePipelineTopologyProps) => {
  const { componentIDs } = props;

  const pipelineTopologyRequestTopic = `${joinIDsWithDelimiter(
    componentIDs,
    "/",
  )}/topology/subscribe`;

  const pipelineTopologyResponseTopic = `${joinIDsWithDelimiter(
    componentIDs,
    "/",
  )}/topology`;

  const { response: topology } = useMQTTRequestResponse<PumpTopologyResponse>({
    requestTopic: pipelineTopologyRequestTopic,
    responseTopic: pipelineTopologyResponseTopic,
    requestMessage: {
      count: 1,
    },
  });

  const pipelineTopology = flattenTopology(topology);

  return { pipelineTopology };
};
