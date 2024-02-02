import mermaid from "mermaid";
import { useEffect } from "react";

mermaid.initialize({});

const MermaidTopologyOverview = ({
  chart,
  id,
}: {
  chart: string;
  id: string;
}) => {
  useEffect(() => {
    document.getElementById(id)?.removeAttribute("data-processed");
    mermaid.contentLoaded();
  }, [chart, id]);

  console.log("chart", chart);

  return chart.length !== 0 ? (
    <div className="mermaid" id={id}>
      {chart}
    </div>
  ) : (
    <div>No Topology available. </div>
  );
};

export default MermaidTopologyOverview;
