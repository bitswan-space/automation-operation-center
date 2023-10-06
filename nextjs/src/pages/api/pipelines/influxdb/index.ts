import { type FluxTableMetaData, InfluxDB } from "@influxdata/influxdb-client";
import type { NextApiRequest, NextApiResponse } from "next";

import { env } from "@/env.mjs";

const url = env.INFLUXDB_URL;
const token = env.INFLUXDB_TOKEN;
const org = env.INFLUXDB_ORG;
const bucket = env.INFLUXDB_BUCKET;

const queryApi = new InfluxDB({ url, token }).getQueryApi(org);
const fluxQuery = `from(bucket: "${bucket}")
  |> range(start: -6h)
  |> filter(fn: (r) => r["_measurement"] == "bspump.pipeline.eps")
  |> filter(fn: (r) => r["_field"] == "eps.in" or r["_field"] == "eps.out")
  |> aggregateWindow(every: 1m, fn: mean, createEmpty: false)
  |> yield(name: "mean")`;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  queryApi.queryRows(fluxQuery, {
    next: (row: string[], tableMeta: FluxTableMetaData) => {
      const o = tableMeta.toObject(row);
      res.write(`data: ${JSON.stringify(o)}\n\n`);
    },
    error: (error: Error) => {
      console.error(error);
      res.write(`data: {"error": "${error.message}"}\n\n`);
      res.end();
    },
    complete: () => {
      res.end();
    },
  });

  // Handle client disconnect
  req.on("close", () => {
    res.end();
  });
}
