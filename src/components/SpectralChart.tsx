import React from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from "recharts";
import { formatTime } from "@/lib/utils";

interface SpectralChartProps {
  times: number[];
  centroid: number[];
  rolloff: number[];
  bandwidth: number[];
  onSeek?: (time: number) => void;
}

export default React.memo(function SpectralChart({ times, centroid, rolloff, bandwidth, onSeek }: SpectralChartProps) {
  const step = Math.max(1, Math.floor(times.length / 400));
  const data = times
    .filter((_, i) => i % step === 0)
    .map((t, i) => ({
      t: parseFloat(t.toFixed(2)),
      centroid: parseFloat((centroid[i * step] || 0).toFixed(1)),
      rolloff: parseFloat((rolloff[i * step] || 0).toFixed(1)),
      bandwidth: parseFloat((bandwidth[i * step] || 0).toFixed(1)),
    }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart 
        data={data} 
        margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
        onClick={(e: any) => {
          if (e && e.activeLabel !== undefined && onSeek) {
            onSeek(Number(e.activeLabel));
          }
        }}
        className={onSeek ? "cursor-pointer" : ""}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="t"
          tickFormatter={formatTime}
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={60}
        />
        <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={42} tickFormatter={(v) => `${(v/1000).toFixed(1)}k`} />
        <Tooltip
          contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8, fontSize: 11, color: "#f8fafc" }}
          labelFormatter={(v) => `Time: ${formatTime(Number(v))}`}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(v: any, name: any) => [`${Number(v).toFixed(0)} Hz`, name]}
        />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        <Line type="monotone" dataKey="centroid"  stroke="#f59e0b" strokeWidth={1.5} dot={false} name="Centroid" />
        <Line type="monotone" dataKey="rolloff"   stroke="#06b6d4" strokeWidth={1.5} dot={false} name="Rolloff" />
        <Line type="monotone" dataKey="bandwidth" stroke="#f43f5e" strokeWidth={1.5} dot={false} name="Bandwidth" />
      </LineChart>
    </ResponsiveContainer>
  );
});
