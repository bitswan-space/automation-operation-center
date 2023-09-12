export const formatPipelineName = (pipelineName: string) => {
  return pipelineName.startsWith("/") ? pipelineName.slice(1) : pipelineName;
};
