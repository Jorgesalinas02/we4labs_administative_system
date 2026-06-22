"use client";

import {
  Bar,
  CartesianGrid,
  Line,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";

export type CashflowMonthPoint = {
  month: string;
  label: string;
  inflow: number;
  outflow: number;
  net: number;
};

function fmtCop(v: number) {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toLocaleString("es-CO");
}

function fmtFull(v: number) {
  return Number(v).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-sm">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
          <span className="text-zinc-600 dark:text-zinc-400">{p.name}:</span>
          <span className="font-semibold tabular-nums" style={{ color: p.color }}>{fmtFull(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export function DashboardCashflowChart({ data }: { data: CashflowMonthPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-zinc-400">Sin transacciones registradas. Agrega datos en Flujo de Caja.</p>
      </div>
    );
  }
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmtCop} tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} width={52} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
          />
          <ReferenceLine y={0} stroke="#e4e4e7" />
          <Bar dataKey="inflow" name="Ingresos" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar dataKey="outflow" name="Egresos" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Line
            type="monotone"
            dataKey="net"
            name="Flujo neto"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={{ fill: "#3b82f6", r: 3 }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
