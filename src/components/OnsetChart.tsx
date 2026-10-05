import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatTime } from "@/lib/utils";

interface OnsetChartProps {
  times: number[];
  strength: number[];
  onSeek?: (time: number) => void;
}

export default React.memo(function OnsetChart({
  times,
  strength,
  onSeek,
}: OnsetChartProps) {
  const step = Math.max(1, Math.floor(times.length / 300));
  const data = times
    .filter((_, i) => i % step === 0)
    .map((t, i) => ({
      t: parseFloat(t.toFixed(2)),
      v: parseFloat((strength[i * step] || 0).toFixed(3)),
    }));

  const maxV = Math.max(...data.map((d) => d.v));

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart
        data={data}
        margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
        barCategoryGap="0%"
        onClick={(e: any) => {
          if (e && e.activeLabel !== undefined && onSeek) {
            onSeek(Number(e.activeLabel));
          }
        }}
        className={onSeek ? "cursor-pointer" : ""}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#f1f5f9"
          vertical={false}
        />
        <XAxis
          dataKey="t"
          tickFormatter={formatTime}
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={60}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip
          contentStyle={{
            background: "#1e293b",
            border: "none",
            borderRadius: 8,
            fontSize: 11,
            color: "#f8fafc",
          }}
          itemStyle={{ color: "#f97316" }}
          labelFormatter={(v) => `Time: ${formatTime(Number(v))}`}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(v: any) => [Number(v).toFixed(3), "Onset Strength"]}
        />
        <Bar dataKey="v" radius={[1, 1, 0, 0]}>
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={
                d.v > maxV * 0.7
                  ? "#f97316"
                  : d.v > maxV * 0.4
                    ? "#fb923c"
                    : "#ffedd5"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});
