import React from "react";
import mermaid from "mermaid";

mermaid.initialize({});

const MermaidTopologyOverview = ({
  chart,
  id,
}: {
  chart: string;
  id: string;
}) => {
  React.useEffect(() => {
    mermaid.contentLoaded();
  }, [chart, id]);

  return chart.length !== 0 ? (
    <div className="mermaid" id={id}>
      {chart}
    </div>
  ) : (
    <div>No Topology available. </div>
  );
};

export default MermaidTopologyOverview;
