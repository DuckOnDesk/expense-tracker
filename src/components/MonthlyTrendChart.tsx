"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatWon } from "@/lib/format";

export interface MonthlyPoint {
  month: string;
  expense: number;
  income: number;
}

export function MonthlyTrendChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" fontSize={12} />
        <YAxis
          fontSize={12}
          tickFormatter={(v) => `${Math.round(v / 10000)}만`}
          width={48}
        />
        <Tooltip formatter={(value) => formatWon(Number(value))} />
        <Bar dataKey="expense" name="지출" fill="#ef4444" radius={[4, 4, 0, 0]} />
        <Bar dataKey="income" name="수입" fill="#22c55e" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
