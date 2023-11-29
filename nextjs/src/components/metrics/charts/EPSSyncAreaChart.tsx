import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { type PipelineStat } from "@/types";

interface EpsSyncAreaChartProps {
  data: PipelineStat[];
}

export const EPSSyncAreaChart = (props: EpsSyncAreaChartProps) => {
  const { data } = props;

  const processData = (data: PipelineStat[], eventKey: string) => {
    return data
      .map((stat) => {
        return {
          time: stat._time,
          [stat._field]: stat._value,
        };
      })
      .filter((stat) => stat[eventKey]);
  };

  return (
    <div
      style={{
        width: "100%",
      }}
      className="space-y-10"
    >
      <div>
        <h4 className="mb-4 text-base font-bold uppercase text-neutral-600">
          eps.in
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            width={400}
            height={200}
            data={processData(data, "eps.in")}
            syncId="anyId"
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="eps.in"
              stroke="#8884d8"
              fill="#8884d8"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h4 className="mb-4 text-base font-bold uppercase text-neutral-600">
          eps.out
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            width={400}
            height={200}
            data={processData(data, "eps.out")}
            syncId="anyId"
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="eps.out"
              stroke="#82ca9d"
              fill="#82ca9d"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
