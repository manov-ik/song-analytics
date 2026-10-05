import React from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip
} from "recharts";

interface ChromaChartProps {
  labels: string[];
  grid: number[][];
}

export default React.memo(function ChromaChart({ labels, grid }: ChromaChartProps) {
  // Average each pitch class over time
  const means = grid.map((row) => row.reduce((a, b) => a + b, 0) / row.length);
  const maxM = Math.max(...means);
  const data = labels.map((label, i) => ({
    note: label,
    value: parseFloat(((means[i] / (maxM || 1)) * 100).toFixed(1)),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data} margin={{ top: 8, right: 20, bottom: 8, left: 20 }}>
        <PolarGrid stroke="#f1f5f9" />
        <PolarAngleAxis dataKey="note" tick={{ fontSize: 11, fill: "#64748b" }} />
        <PolarRadiusAxis tick={false} axisLine={false} />
        <Radar
          name="Chroma"
          dataKey="value"
          stroke="#f97316"
          fill="#f97316"
          fillOpacity={0.2}
          strokeWidth={2}
        />
        <Tooltip
          contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8, fontSize: 11, color: "#f8fafc" }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(v: any) => [Number(v).toFixed(1) + "%", "Presence"]}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
});
