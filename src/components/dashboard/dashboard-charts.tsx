"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type WeeklyPracticeItem = {
  day: string;
  count: number;
  score: number;
};

type WeakAreaItem = {
  name: string;
  score: number;
};

const tooltipStyle = {
  border: "1px solid rgb(23 21 31 / 0.12)",
  borderRadius: 14,
  boxShadow: "0 12px 32px rgb(23 21 31 / 0.10)"
};

function useMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return mounted;
}

export function PracticeTrendChart({ data }: { data: WeeklyPracticeItem[] }) {
  const mounted = useMounted();

  if (!mounted) {
    return <div className="h-56 min-w-0 rounded-2xl bg-[#17151f0a]" />;
  }

  return (
    <div className="h-56 min-w-0">
      <ResponsiveContainer height="100%" minWidth={0} width="100%">
        <LineChart data={data} margin={{ bottom: 0, left: -18, right: 8, top: 10 }}>
          <CartesianGrid stroke="#17151f14" strokeDasharray="4 4" vertical={false} />
          <XAxis axisLine={false} dataKey="day" tick={{ fill: "#17151f73", fontSize: 12 }} tickLine={false} />
          <YAxis axisLine={false} domain={[40, 100]} tick={{ fill: "#17151f73", fontSize: 12 }} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [value, name === "score" ? "反馈分" : "练习题数"]} />
          <Line dataKey="score" dot={{ fill: "#fff", r: 4, stroke: "#17151f", strokeWidth: 2 }} name="反馈分" stroke="#17151f" strokeWidth={3} type="monotone" />
          <Line dataKey="count" dot={false} name="练习题数" stroke="#ec4899" strokeDasharray="4 4" strokeWidth={2} type="monotone" yAxisId={0} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeakAreaBarChart({ data }: { data: WeakAreaItem[] }) {
  const mounted = useMounted();

  if (!mounted) {
    return <div className="h-56 min-w-0 rounded-2xl bg-[#17151f0a]" />;
  }

  return (
    <div className="h-56 min-w-0">
      <ResponsiveContainer height="100%" minWidth={0} width="100%">
        <BarChart data={data} layout="vertical" margin={{ bottom: 4, left: 18, right: 18, top: 4 }}>
          <CartesianGrid stroke="#17151f14" strokeDasharray="4 4" horizontal={false} />
          <XAxis axisLine={false} domain={[0, 100]} tick={{ fill: "#17151f73", fontSize: 12 }} tickLine={false} type="number" />
          <YAxis axisLine={false} dataKey="name" tick={{ fill: "#17151f", fontSize: 12, fontWeight: 700 }} tickLine={false} type="category" width={86} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value}`, "掌握分"]} />
          <Bar background={{ fill: "#17151f0d", radius: 8 }} dataKey="score" fill="#17151f" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
