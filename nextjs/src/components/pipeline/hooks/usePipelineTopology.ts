import { useMQTTRequestResponse } from "@/shared/hooks/useMQTTRequestResponse";
import { type PumpTopologyResponse } from "@/types";
import { flattenTopology, joinIDsWithDelimiter } from "@/utils/pipelineUtils";
import { type TokenData } from "@/data/mqtt";
import { useMemo } from "react";

type UsePipelineTopologyProps = {
  automationServerId: string;
  workspaceId: string;
  componentIDs: string[];
  token?: TokenData;
};

export const usePipelineTopology = (props: UsePipelineTopologyProps) => {
  const { componentIDs, token } = props;

  const pipelineTopologyRequestTopic = `${joinIDsWithDelimiter(
    componentIDs,
    "/",
  )}/topology/subscribe`;

  const pipelineTopologyResponseTopic = `${joinIDsWithDelimiter(
    componentIDs,
    "/",
  )}/topology`;

  // Memoize the tokens array to prevent unnecessary re-renders
  const tokens = useMemo(() => {
    return token ? [token] : [];
  }, [token]);

  const { response: topology } = useMQTTRequestResponse<PumpTopologyResponse>({
    requestTopic: pipelineTopologyRequestTopic,
    responseTopic: pipelineTopologyResponseTopic,
    tokens,
  });

  const pipelineTopology = flattenTopology(topology);

  return { pipelineTopology };
};
