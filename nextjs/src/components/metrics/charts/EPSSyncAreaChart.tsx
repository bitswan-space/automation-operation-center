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

  const processData = (data: PipelineStat[]) => {
    return data.map((stat) => {
      return {
        // time: stat._time,
        [stat._field]: stat._value,
      };
    });
  };

  return (
    <div
      style={{
        width: "100%",
      }}
      className="space-y-10"
    >
      <div>
        <h4 className="text-xs font-semibold uppercase text-neutral-600">
          eps.in
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            width={400}
            height={200}
            data={processData(data)}
            syncId="anyId"
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" hide />
            <YAxis hide />
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
        <h4 className="text-xs font-semibold uppercase text-neutral-600">
          eps.out
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            width={400}
            height={200}
            data={processData(data)}
            syncId="anyId"
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" hide />
            <YAxis hide />
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
