"use client";

import {
  Area,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ForecastPoint } from "@/lib/demoData";

export default function PowerBalanceChart({
  points,
  pltdLimit,
}: {
  points: ForecastPoint[];
  pltdLimit: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={224}>
      <ComposedChart
        data={points}
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="pltsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22C55E" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="jam"
          tick={{ fontSize: 11, fill: "#94A3B8" }}

          interval="preserveStartEnd"
          minTickGap={36}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#94A3B8" }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #E5E7EB",
            fontSize: 12,
          }}
          formatter={(v) => `${v} kW`}
        />
        <ReferenceLine
          y={pltdLimit}
          stroke="#94A3B8"
          strokeDasharray="6 6"
          label={{
            value: "Batas PLTD",
            position: "right",
            fontSize: 10,
            fill: "#94A3B8",
          }}
        />
        <Area
          type="monotone"
          dataKey="plts"
          name="Prediksi PLTS"
          stroke="#16A34A"
          strokeWidth={2.5}
          fill="url(#pltsFill)"
        />
        <Line
          type="monotone"
          dataKey="beban"
          name="Beban"
          stroke="#0F172A"
          strokeWidth={2.5}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
