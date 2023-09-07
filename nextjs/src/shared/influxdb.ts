import { InfluxDB } from "@influxdata/influxdb-client";
import { env } from "@/env.mjs";

const url = env.INFLUXDB_URL;
const token = env.INFLUXDB_TOKEN;

export const influxdb = new InfluxDB({ url, token });
