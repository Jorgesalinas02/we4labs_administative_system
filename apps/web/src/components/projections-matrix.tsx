"use client";

import { useMemo, useState } from "react";
import type { BusinessCategoryRecord } from "@/lib/data";
import { cashFlowMonthLabelEs } from "@we4labs/shared";
import { cn } from "@/lib/cn";

// ─── Constantes ──────────────────────────────────────────────────────────────

const LEVELS = [
  {
    key: "conservador",
    label: "Conservador",
    annualGrowth: 0.03,
    color: "text-amber-700 dark:text-amber-400",
    activeBg: "bg-amber-50 border-amber-400 text-amber-800 dark:bg-amber-900/30 dark:border-amber-500 dark:text-amber-300",
  },
  {
    key: "normal",
    label: "Normal",
    annualGrowth: 0.10,
    color: "text-blue-700 dark:text-blue-400",
    activeBg: "bg-blue-50 border-blue-400 text-blue-800 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-300",
  },
  {
    key: "optimista",
    label: "Optimista",
    annualGrowth: 0.20,
    color: "text-emerald-700 dark:text-emerald-400",
    activeBg: "bg-emerald-50 border-emerald-400 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-500 dark:text-emerald-300",
  },
] as const;

type LevelKey = (typeof LEVELS)[number]["key"];

const PERIODS = [3, 6, 12, 18, 24] as const;
type Period = (typeof PERIODS)[number];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n === 0) return "—";
  return n.toLocaleString("es-CO", { maximumFractionDigits: 0 });
}
function fmtBold(n: number) {
  return `$${n.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
}

/** Next month after a YYYY-MM string */
function nextYm(ym: string): string {
  const [y, m] = ym.split("-").map(Number) as [number, number];
  const next = new Date(y, m, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}

/** Generate N future months starting after lastHistoricalYm */
function buildFutureMonths(lastYm: string, n: number): string[] {
  const months: string[] = [];
  let cur = lastYm;
  for (let i = 0; i < n; i++) {
    cur = nextYm(cur);
    months.push(cur);
  }
  return months;
}

/**
 * Compute monthly average of the last `window` months of historical data for a code.
 * Falls back to 0 if no data.
 */
function computeBase(
  code: string,
  histMonths: string[],
  cells: Record<string, Record<string, number>>,
  window = 3,
): number {
  const relevant = histMonths.slice(-window);
  const vals = relevant.map((ym) => cells[code]?.[ym] ?? 0);
  const nonZero = vals.filter((v) => v > 0);
  if (nonZero.length === 0) return 0;
  return nonZero.reduce((a, b) => a + b, 0) / nonZero.length;
}

/** Project base forward n months with monthly compounding of annualGrowth */
function project(base: number, monthIndex: number, annualGrowth: number): number {
  if (base === 0) return 0;
  const monthly = Math.pow(1 + annualGrowth, 1 / 12) - 1;
  return Math.round(base * Math.pow(1 + monthly, monthIndex + 1));
}

// ─── Sub-row component ────────────────────────────────────────────────────────

function SectionHeader({ label, colCount }: { label: string; colCount: number }) {
  return (
    <tr className="border-b border-zinc-200 dark:border-zinc-800">
      <td
        colSpan={colCount + 2}
        className="sticky left-0 z-10 bg-zinc-100 px-3 py-2 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
      >
        {label}
      </td>
    </tr>
  );
}

function GroupRow({
  label,
  values,
  months,
  annual,
}: {
  label: string;
  values: number[];
  months: string[];
  annual: number;
}) {
  return (
    <tr className="border-b border-zinc-100 hover:bg-zinc-50/60 dark:border-zinc-800 dark:hover:bg-zinc-800/20">
      <td className="sticky left-0 z-10 min-w-[220px] max-w-[260px] border-r border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
        {label}
      </td>
      {values.map((v, i) => (
        <td
          key={months[i]}
          className="border-r border-zinc-100 px-2.5 py-2 text-right text-sm tabular-nums text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
        >
          {fmt(v)}
        </td>
      ))}
      <td className="border-l border-zinc-200 px-3 py-2 text-right text-sm font-semibold tabular-nums text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
        {annual === 0 ? "—" : fmtBold(annual)}
      </td>
    </tr>
  );
}

function TotalRow({
  label,
  values,
  months,
  positive,
}: {
  label: string;
  values: number[];
  months: string[];
  positive?: boolean;
}) {
  const annual = values.reduce((a, b) => a + b, 0);
  return (
    <tr className="border-b border-zinc-300 dark:border-zinc-700">
      <td className="sticky left-0 z-10 min-w-[220px] max-w-[260px] border-r border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
        {label}
      </td>
      {values.map((v, i) => (
        <td
          key={months[i]}
          className={cn(
            "border-r border-zinc-200 px-2.5 py-2 text-right text-sm font-semibold tabular-nums dark:border-zinc-800",
            positive
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-red-600 dark:text-red-400",
          )}
        >
          {fmtBold(v)}
        </td>
      ))}
      <td className="border-l border-zinc-200 px-3 py-2 text-right text-sm font-bold tabular-nums text-zinc-900 dark:border-zinc-800 dark:text-zinc-100">
        {fmtBold(annual)}
      </td>
    </tr>
  );
}

function NetRow({
  label,
  values,
  months,
}: {
  label: string;
  values: number[];
  months: string[];
}) {
  const annual = values.reduce((a, b) => a + b, 0);
  return (
    <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40">
      <td className="sticky left-0 z-10 min-w-[220px] max-w-[260px] border-r border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-bold text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
        {label}
      </td>
      {values.map((v, i) => (
        <td
          key={months[i]}
          className={cn(
            "border-r border-zinc-200 px-2.5 py-2 text-right text-sm font-bold tabular-nums dark:border-zinc-800",
            v < 0 ? "text-red-600 dark:text-red-400" : "text-zinc-900 dark:text-zinc-100",
          )}
        >
          {fmtBold(v)}
        </td>
      ))}
      <td className="border-l border-zinc-200 px-3 py-2 text-right text-sm font-bold tabular-nums text-zinc-900 dark:border-zinc-800 dark:text-zinc-100">
        {fmtBold(annual)}
      </td>
    </tr>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Props = {
  incomeCategories: BusinessCategoryRecord[];
  expenseCategories: BusinessCategoryRecord[];
  historicalCells: Record<string, Record<string, number>>;
  histMonths: string[];
};

export function ProjectionsMatrix({
  incomeCategories,
  expenseCategories,
  historicalCells,
  histMonths,
}: Props) {
  const [level, setLevel] = useState<LevelKey>("normal");
  const [period, setPeriod] = useState<Period>(6);

  const activeLevel = LEVELS.find((l) => l.key === level)!;

  // Last historical month as base
  const lastHistYm = histMonths[histMonths.length - 1] ?? new Date().toISOString().slice(0, 7);

  const futureMonths = useMemo(
    () => buildFutureMonths(lastHistYm, period),
    [lastHistYm, period],
  );
  const monthLabels = futureMonths.map(cashFlowMonthLabelEs);

  // Group categories by parent
  const incomeGroups = useMemo(() => {
    const map = new Map<string, { label: string; cats: BusinessCategoryRecord[] }>();
    for (const c of incomeCategories) {
      const g = map.get(c.parentCode) ?? { label: c.parentLabel, cats: [] };
      g.cats.push(c);
      map.set(c.parentCode, g);
    }
    return [...map.entries()];
  }, [incomeCategories]);

  const expenseGroups = useMemo(() => {
    const map = new Map<string, { label: string; cats: BusinessCategoryRecord[] }>();
    for (const c of expenseCategories) {
      const g = map.get(c.parentCode) ?? { label: c.parentLabel, cats: [] };
      g.cats.push(c);
      map.set(c.parentCode, g);
    }
    return [...map.entries()];
  }, [expenseCategories]);

  // Compute projected values per parent group
  function groupProjected(cats: BusinessCategoryRecord[]): number[] {
    return futureMonths.map((_, mi) =>
      cats.reduce((sum, c) => {
        const base = computeBase(c.code, histMonths, historicalCells, 3);
        return sum + project(base, mi, activeLevel.annualGrowth);
      }, 0),
    );
  }

  const incomeGroupValues = useMemo(
    () => incomeGroups.map(([, g]) => groupProjected(g.cats)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [incomeGroups, futureMonths, level, historicalCells],
  );
  const expenseGroupValues = useMemo(
    () => expenseGroups.map(([, g]) => groupProjected(g.cats)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expenseGroups, futureMonths, level, historicalCells],
  );

  const totalIncome = useMemo(
    () => futureMonths.map((_, mi) => incomeGroupValues.reduce((s, vals) => s + (vals[mi] ?? 0), 0)),
    [incomeGroupValues, futureMonths],
  );
  const totalExpense = useMemo(
    () => futureMonths.map((_, mi) => expenseGroupValues.reduce((s, vals) => s + (vals[mi] ?? 0), 0)),
    [expenseGroupValues, futureMonths],
  );
  const flujoNeto = useMemo(
    () => futureMonths.map((_, mi) => (totalIncome[mi] ?? 0) - (totalExpense[mi] ?? 0)),
    [totalIncome, totalExpense, futureMonths],
  );

  const noData =
    incomeCategories.length === 0 && expenseCategories.length === 0;
  const noHistorical =
    incomeCategories.every((c) =>
      histMonths.every((ym) => (historicalCells[c.code]?.[ym] ?? 0) === 0),
    ) &&
    expenseCategories.every((c) =>
      histMonths.every((ym) => (historicalCells[c.code]?.[ym] ?? 0) === 0),
    );

  const TH_MONTH =
    "min-w-[120px] border-r border-zinc-200 px-2.5 py-2.5 text-right font-medium whitespace-nowrap tabular-nums tracking-tight text-zinc-500 dark:border-zinc-800 dark:text-zinc-400";

  return (
    <div className="space-y-5">
      {/* ── Controls ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Level */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Nivel:</span>
          <div className="flex gap-1">
            {LEVELS.map((l) => (
              <button
                key={l.key}
                onClick={() => setLevel(l.key)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                  level === l.key
                    ? l.activeBg
                    : "border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800",
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Period */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Horizonte:</span>
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  period === p
                    ? "border-zinc-800 bg-zinc-900 text-white dark:border-zinc-200 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800",
                )}
              >
                {p}m
              </button>
            ))}
          </div>
        </div>

        {/* Growth badge */}
        <div className={cn("rounded-full px-3 py-1 text-xs font-semibold", activeLevel.activeBg)}>
          Crecimiento anual estimado: {(activeLevel.annualGrowth * 100).toFixed(0)}%
        </div>
      </div>

      {/* No data warnings */}
      {noData && (
        <p className="rounded-lg border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-400 dark:border-zinc-700">
          Configura tus categorías de ingresos y egresos en{" "}
          <a href="/supuestos" className="underline hover:text-zinc-600">Supuestos</a>{" "}
          para ver la proyección.
        </p>
      )}
      {!noData && noHistorical && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          No hay datos reales registrados aún. Registra valores en{" "}
          <a href="/flujo-caja" className="underline hover:text-amber-800">Flujo de caja</a>{" "}
          para que la proyección sea más precisa. Por ahora se muestra en cero.
        </p>
      )}

      {/* ── Matrix ───────────────────────────────────────────────── */}
      {!noData && (
        <div className="w-full overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <table className="min-w-[900px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                <th className="sticky left-0 z-20 min-w-[220px] max-w-[260px] border-r border-zinc-200 bg-zinc-50 px-3 py-2.5 text-left font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                  Concepto
                </th>
                {monthLabels.map((label, i) => (
                  <th key={futureMonths[i]} className={TH_MONTH}>
                    {label}
                  </th>
                ))}
                <th className="min-w-[120px] border-l border-zinc-200 px-3 py-2.5 text-right font-semibold whitespace-nowrap tabular-nums text-zinc-800 dark:border-zinc-800 dark:text-zinc-200">
                  Total período
                </th>
              </tr>
            </thead>
            <tbody>
              {/* INGRESOS */}
              <SectionHeader label="Ingresos proyectados" colCount={futureMonths.length} />
              {incomeGroups.map(([parentCode, g], gi) => (
                <GroupRow
                  key={parentCode}
                  label={g.label}
                  values={incomeGroupValues[gi] ?? []}
                  months={futureMonths}
                  annual={(incomeGroupValues[gi] ?? []).reduce((a, b) => a + b, 0)}
                />
              ))}
              {incomeCategories.length === 0 && (
                <tr>
                  <td colSpan={futureMonths.length + 2} className="px-4 py-3 text-sm text-zinc-400 italic">
                    Sin categorías de ingreso configuradas.
                  </td>
                </tr>
              )}
              <TotalRow label="TOTAL INGRESOS" values={totalIncome} months={futureMonths} positive />

              {/* EGRESOS */}
              <SectionHeader label="Egresos proyectados" colCount={futureMonths.length} />
              {expenseGroups.map(([parentCode, g], gi) => (
                <GroupRow
                  key={parentCode}
                  label={g.label}
                  values={expenseGroupValues[gi] ?? []}
                  months={futureMonths}
                  annual={(expenseGroupValues[gi] ?? []).reduce((a, b) => a + b, 0)}
                />
              ))}
              {expenseCategories.length === 0 && (
                <tr>
                  <td colSpan={futureMonths.length + 2} className="px-4 py-3 text-sm text-zinc-400 italic">
                    Sin categorías de egreso configuradas.
                  </td>
                </tr>
              )}
              <TotalRow label="TOTAL EGRESOS" values={totalExpense} months={futureMonths} />

              {/* FLUJO NETO */}
              <NetRow label="Flujo neto proyectado" values={flujoNeto} months={futureMonths} />
            </tbody>
          </table>
        </div>
      )}

      {/* ── Methodology note ─────────────────────────────────────── */}
      {!noData && (
        <p className="text-xs text-zinc-400 dark:text-zinc-600">
          Base de cálculo: promedio de los últimos 3 meses con datos reales en Flujo de caja.
          Crecimiento compuesto mensual · Conservador {(Math.pow(1.03, 1/12) - 1).toFixed(4).slice(1)}% ·
          Normal {(Math.pow(1.10, 1/12) - 1).toFixed(4).slice(1)}% ·
          Optimista {(Math.pow(1.20, 1/12) - 1).toFixed(4).slice(1)}% mensual.
        </p>
      )}
    </div>
  );
}
