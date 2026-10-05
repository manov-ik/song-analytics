import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine
} from "recharts";

interface MfccChartProps {
  mean: number[];
}

export default React.memo(function MfccChart({ mean }: MfccChartProps) {
  const data = mean.map((v, i) => ({ coeff: `C${i + 1}`, value: parseFloat(v.toFixed(2)) }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="coeff" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={42} />
        <ReferenceLine y={0} stroke="#e2e8f0" />
        <Tooltip
          contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8, fontSize: 11, color: "#f8fafc" }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(v: any) => [Number(v).toFixed(2), "Mean MFCC"]}
        />
        <Bar dataKey="value" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.value >= 0 ? "#f97316" : "#0ea5e9"} opacity={0.8 - i * 0.03} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});
