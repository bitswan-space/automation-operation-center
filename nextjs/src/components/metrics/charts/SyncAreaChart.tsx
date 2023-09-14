import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  {
    name: "Page A",
    in: 4000,
    out: 2400,
    amt: 2400,
  },
  {
    name: "Page B",
    in: 3000,
    out: 1398,
    amt: 2210,
  },
  {
    name: "Page C",
    in: 2000,
    out: 9800,
    amt: 2290,
  },
  {
    name: "Page D",
    in: 2780,
    out: 3908,
    amt: 2000,
  },
  {
    name: "Page E",
    in: 1890,
    out: 4800,
    amt: 2181,
  },
  {
    name: "Page F",
    in: 2390,
    out: 3800,
    amt: 2500,
  },
  {
    name: "Page G",
    in: 3490,
    out: 4300,
    amt: 2100,
  },
];

export const SyncAreaChart = () => {
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
            data={data}
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
              dataKey="in"
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
            data={data}
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
              dataKey="out"
              stroke="#82ca9d"
              fill="#82ca9d"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
