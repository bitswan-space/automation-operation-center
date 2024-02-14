import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
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

  const epsInData = processData(data, "eps.in");
  const epsOutData = processData(data, "eps.out");

  const DataFormater = (number: number) => {
    if (number >= 1000000000) {
      return (number / 1000000000).toString() + "b";
    } else if (number >= 1000000) {
      return (number / 1000000).toString() + "m";
    } else if (number >= 1000) {
      return (number / 1000).toString() + "k";
    } else {
      return number.toString();
    }
  };

  return (
    <div
      style={{
        width: "100%",
      }}
      className="md:space-y-10"
    >
      <div>
        <h4 className="mb-4 text-base font-bold uppercase text-neutral-600">
          eps.in
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={epsInData}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              includeHidden
              dataKey="time"
              type="category"
              tick={{ fontSize: 12, dy: 10 }}
              interval={"preserveStartEnd"}
              ticks={[
                epsInData[0]?.time ?? "10:00:00",
                epsInData[epsInData.length - 1]?.time ?? "0:00:00",
              ]}
              height={60}
              className="hidden md:block"
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, dx: -10 }}
              tickFormatter={DataFormater}
            />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="eps.in"
              stroke="#8884d8"
              fill="#8884d8"
            />
            <Legend />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h4 className="mb-4 text-base font-bold uppercase text-neutral-600">
          eps.out
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={epsOutData}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              includeHidden
              dataKey="time"
              type="category"
              tick={{ fontSize: 12, dy: 12 }}
              interval={"preserveStartEnd"}
              ticks={[
                epsOutData[0]?.time ?? "10:00:00",
                epsOutData[epsOutData.length - 1]?.time ?? "0:00:00",
              ]}
              height={60}
              className="hidden md:block"
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, dx: -10 }}
              tickFormatter={DataFormater}
            />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="eps.out"
              stroke="#82ca9d"
              fill="#82ca9d"
            />
            <Legend />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
