import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from "recharts";
import { formatTime } from "@/lib/utils";

interface WaveformChartProps {
  times: number[];
  values: number[];
  beatTimes: number[];
  color?: string;
  label?: string;
  onSeek?: (time: number) => void;
}

export default React.memo(function WaveformChart({
  times, values, beatTimes, color = "#f97316", label = "RMS Energy", onSeek
}: WaveformChartProps) {
  const data = times.map((t, i) => ({ t: parseFloat(t.toFixed(2)), v: parseFloat(values[i].toFixed(4)) }));
  const beatSet = new Set(beatTimes.map((b) => Math.round(b * 10) / 10));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart 
        data={data} 
        margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
        onClick={(e: any) => {
          if (e && e.activeLabel !== undefined && onSeek) {
            onSeek(Number(e.activeLabel));
          }
        }}
        className={onSeek ? "cursor-pointer" : ""}
      >
        <defs>
          <linearGradient id="wfGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        {beatTimes.slice(0, 80).map((bt) => (
          <ReferenceLine key={bt} x={parseFloat(bt.toFixed(2))} stroke="#c4b5fd" strokeWidth={0.8} strokeDasharray="2 3" />
        ))}
        <XAxis
          dataKey="t"
          tickFormatter={formatTime}
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={60}
        />
        <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={36} />
        <Tooltip
          contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8, fontSize: 11, color: "#f8fafc" }}
          labelFormatter={(v) => `Time: ${formatTime(Number(v))}`}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(v: any) => [Number(v).toFixed(4), label]}
        />
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          fill="url(#wfGrad)"
          dot={false}
          activeDot={{ r: 3, fill: color }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});
