import { type PipelineStat } from "@/types";
import React from "react";
import { handleError } from "@/utils/errors";

const API_BASE_URL = "/api";

export const usePipelineStats = () => {
  const [data, setData] = React.useState<PipelineStat[]>([]);

  React.useEffect(() => {
    const eventSource = new EventSource(`${API_BASE_URL}/automations/influxdb`);

    eventSource.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data as string) as PipelineStat;
        setData((prevData) => [...prevData, parsedData]);
      } catch (error) {
        handleError(error as Error, "Failed to parse event data");
      }
    };

    eventSource.onerror = (error) => {
      // The error event is fired when a stream is closed by the server
      // it's part of the spec and not an actual error
      if (process.env.NODE_ENV === "development") {
        console.info("EventSource failed:", error);
      }
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return data;
};