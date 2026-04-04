"use client";

import { useMemo, useState } from "react";
import type { CashFlowLineDef, CashFlowSheetViewModel } from "@we4labs/shared";
import { computeCashFlowSheet } from "@we4labs/shared";
import { Button } from "@/components/ui/button";
import { CopAmountInput } from "@/components/cop-amount-input";
import { cn } from "@/lib/cn";
import { displayCashFlowLineLabel } from "@/lib/cash-flow-display";
import {
  CF_ALL_EXPAND_KEYS,
  getCashFlowCollapseMeta,
  isRowVisible,
  type CfExpandKey,
} from "@/lib/cash-flow-collapse-meta";
import { ChevronDown, ChevronRight } from "lucide-react";

/** Fondo para títulos de tabla, encabezados de bloque y filas total / subtotal. */
const CF_ROW_GRAY =
  "bg-zinc-100 dark:bg-zinc-900/50";

/** `peso`: prefijo $ pegado al valor (totales / subtotales). */
function formatCop(n: number, peso: boolean) {
  const s = n.toLocaleString("es-CO", { maximumFractionDigits: 0 });
  return peso ? `$${s}` : s;
}

function buildDraft(
  lines: CashFlowLineDef[],
  months: string[],
  values: Record<string, Record<string, number>>,
): Record<string, Record<string, number>> {
  const d: Record<string, Record<string, number>> = {};
  const first = months[0];
  for (const line of lines) {
    if (!line.isInput) continue;
    d[line.code] = {};
    for (const ym of months) {
      if (line.code === "saldo_inicial_de_caja" && ym !== first) continue;
      d[line.code]![ym] = values[line.code]?.[ym] ?? 0;
    }
  }
  return d;
}

function draftToStored(draft: Record<string, Record<string, number>>) {
  const stored: Record<string, Record<string, number>> = {};
  for (const [code, byM] of Object.entries(draft)) {
    stored[code] = { ...byM };
  }
  return stored;
}

export function CashFlowSheetMatrix({ initial }: { initial: CashFlowSheetViewModel }) {
  const [payload, setPayload] = useState(initial);
  const [draft, setDraft] = useState(() =>
    buildDraft(initial.lines, initial.months, initial.values),
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(CF_ALL_EXPAND_KEYS));

  function toggleCollapse(key: CfExpandKey) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const { cells: display, annual } = useMemo(
    () => computeCashFlowSheet(payload.months, draftToStored(draft)),
    [draft, payload.months],
  );

  const firstYm = payload.months[0]!;

  function setAmount(lineCode: string, ym: string, value: number) {
    if (lineCode === "saldo_inicial_de_caja" && ym !== firstYm) return;
    setDraft((prev) => ({
      ...prev,
      [lineCode]: { ...prev[lineCode], [ym]: value },
    }));
  }

  async function save() {
    setErr(null);
    setSaving(true);
    try {
      const cells: { lineCode: string; periodYm: string; amount: number }[] = [];
      for (const [lineCode, byM] of Object.entries(draft)) {
        for (const [periodYm, amount] of Object.entries(byM)) {
          cells.push({ lineCode, periodYm, amount });
        }
      }
      const res = await fetch("/api/cash-flow-sheet", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cells }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof body.error === "string" ? body.error : "No se pudo guardar");
      }
      setPayload(body as CashFlowSheetViewModel);
      setDraft(buildDraft(body.lines, body.months, body.values));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => void save()} disabled={saving}>
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
        <p className="text-sm text-zinc-500">
          Primer mes del horizonte:{" "}
          <span className="font-medium text-zinc-800 dark:text-zinc-200">{payload.startYm}</span>
          {" — "}Plantilla tipo Excel (conceptos × 12 meses + total).
        </p>
      </div>
      {err && <p className="text-sm text-red-600 dark:text-red-400">{err}</p>}
      <div className="inline-block min-w-full rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <table className="min-w-[2000px] border-collapse border-spacing-0 text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
              <th className="sticky left-0 z-20 min-w-[17rem] max-w-[20rem] border-r border-zinc-200 bg-zinc-50 px-3 py-2.5 text-left font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300">
                Concepto
              </th>
              {payload.monthLabels.map((label, i) => (
                <th
                  key={payload.months[i]}
                  className={cn(
                    "min-w-[9rem] border-r border-zinc-200 bg-zinc-50 px-2.5 py-2.5 text-right font-medium whitespace-nowrap tabular-nums tracking-tight text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400",
                    i === payload.months.length - 1 && "border-r-0",
                  )}
                >
                  {label}
                </th>
              ))}
              <th className="min-w-[10rem] whitespace-nowrap border-l border-r border-zinc-200 bg-zinc-50 px-3 py-2.5 text-right font-semibold tabular-nums tracking-tight text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-200">
                Total anual
              </th>
            </tr>
          </thead>
          <tbody>
            {payload.lines.map((line) => {
              const collapseMeta = getCashFlowCollapseMeta(line.code);
              if (!isRowVisible(expanded, collapseMeta)) {
                return null;
              }

              if (line.isTableTitle) {
                return (
                  <tr key={line.code} className={cn("border-b border-zinc-200 dark:border-zinc-800", CF_ROW_GRAY)}>
                    <td
                      colSpan={payload.months.length + 2}
                      className={cn("border-r border-zinc-200 px-3 py-2 font-semibold text-zinc-800 dark:border-zinc-800 dark:text-zinc-100", CF_ROW_GRAY)}
                    >
                      {displayCashFlowLineLabel(line.label)}
                    </td>
                  </tr>
                );
              }
              if (line.isHeader) {
                const tk = collapseMeta.toggleKey;
                const labelCell = tk ? (
                  <button
                    type="button"
                    className={cn(
                      "flex w-full min-w-0 items-center gap-2 rounded-md py-0.5 text-left font-medium text-zinc-800 transition-colors hover:bg-zinc-200/50 dark:text-zinc-200 dark:hover:bg-zinc-800/70",
                      tk.startsWith("s:") ? "pl-7" : "pl-1",
                    )}
                    onClick={() => toggleCollapse(tk)}
                    aria-expanded={expanded.has(tk)}
                  >
                    {expanded.has(tk) ? (
                      <ChevronDown className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                    )}
                    <span>{displayCashFlowLineLabel(line.label)}</span>
                  </button>
                ) : (
                  <span className="block">{displayCashFlowLineLabel(line.label)}</span>
                );
                return (
                  <tr key={line.code} className={cn("border-b border-zinc-200 dark:border-zinc-800", CF_ROW_GRAY)}>
                    <td
                      className={cn(
                        "sticky left-0 z-10 min-w-[17rem] max-w-[20rem] border-r border-zinc-200 px-3 py-1.5 dark:border-zinc-800 dark:text-zinc-200",
                        CF_ROW_GRAY,
                      )}
                    >
                      {line.label ? labelCell : null}
                    </td>
                    {payload.months.map((ym, mi) => (
                      <td
                        key={ym}
                        className={cn(
                          "min-w-[9rem] border-r border-zinc-200 dark:border-zinc-800",
                          CF_ROW_GRAY,
                          mi === payload.months.length - 1 && "border-r-0",
                        )}
                      />
                    ))}
                    <td className={cn("min-w-[10rem] border-l border-r border-zinc-200 dark:border-zinc-800", CF_ROW_GRAY)} />
                  </tr>
                );
              }
              const isBold =
                line.code.includes("total") ||
                line.code.includes("flujo_neto") ||
                line.code.includes("saldo_final");
              const detailSubIndent =
                collapseMeta.requiredKeys?.some((k) => k.startsWith("s:")) ?? false;
              const detailRowBg = isBold ? CF_ROW_GRAY : "bg-white dark:bg-zinc-950";
              return (
                <tr key={line.code} className={cn("border-b border-zinc-200 dark:border-zinc-800", detailRowBg)}>
                  <td
                    className={cn(
                      "sticky left-0 z-10 min-w-[17rem] max-w-[20rem] border-r border-zinc-200 px-3 py-1.5 align-middle dark:border-zinc-800",
                      detailRowBg,
                      isBold ? "font-semibold text-zinc-900 dark:text-zinc-100" : "text-zinc-700 dark:text-zinc-300",
                      detailSubIndent && "pl-7",
                    )}
                  >
                    {displayCashFlowLineLabel(line.label)}
                  </td>
                  {payload.months.map((ym, mi) => {
                    const v = display[line.code]?.[ym] ?? 0;
                    const editable =
                      line.isInput && (line.code !== "saldo_inicial_de_caja" || ym === firstYm);
                    const monthCell = cn(
                      "min-w-[9rem] border-r border-zinc-200 align-middle dark:border-zinc-800",
                      detailRowBg,
                      mi === payload.months.length - 1 && "border-r-0",
                    );
                    if (editable) {
                      const dval = draft[line.code]?.[ym] ?? 0;
                      return (
                        <td key={ym} className={cn(monthCell, "p-1")}>
                          <div
                            className={cn(
                              "flex h-9 w-full min-w-[8rem] items-stretch rounded-md border border-zinc-200 dark:border-zinc-700",
                              isBold
                                ? "bg-white dark:bg-zinc-950"
                                : "bg-white dark:bg-zinc-900",
                            )}
                          >
                            <span
                              className="flex shrink-0 items-center border-r border-zinc-200 px-2 text-sm font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
                              aria-hidden
                            >
                              $
                            </span>
                            <CopAmountInput
                              value={dval}
                              onCommit={(n) => setAmount(line.code, ym, n)}
                              className="min-w-0 flex-1 border-0 bg-transparent py-1 pr-2 shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-transparent"
                            />
                          </div>
                        </td>
                      );
                    }
                    return (
                      <td
                        key={ym}
                        className={cn(
                          monthCell,
                          "whitespace-nowrap px-2.5 py-2 text-right text-sm tabular-nums tracking-tight",
                          isBold ? "font-semibold text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400",
                        )}
                      >
                        {formatCop(v, isBold)}
                      </td>
                    );
                  })}
                  <td
                    className={cn(
                      "min-w-[10rem] whitespace-nowrap border-l border-r border-zinc-200 px-3 py-2 text-right text-sm tabular-nums tracking-tight dark:border-zinc-800",
                      detailRowBg,
                      isBold ? "font-semibold text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400",
                    )}
                  >
                    {formatCop(annual[line.code] ?? 0, isBold)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
