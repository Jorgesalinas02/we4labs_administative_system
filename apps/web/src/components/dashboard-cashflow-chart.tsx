"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type CashflowMonthPoint = {
  month: string;
  label: string;
  inflow: number;
  outflow: number;
};

function fmtCop(v: number) {
  return v.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

export function DashboardCashflowChart({ data }: { data: CashflowMonthPoint[] }) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500">
        Sin movimientos por mes para graficar. Agrega flujo de caja real.
      </p>
    );
  }
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v) => `${(Number(v) / 1_000_000).toFixed(1)}M`} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value) => fmtCop(Number(value ?? 0))}
            labelFormatter={(label) => `Periodo ${label}`}
          />
          <Legend />
          <Bar dataKey="inflow" name="Entradas" fill="rgb(22 163 74)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="outflow" name="Salidas" fill="rgb(220 38 38)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
