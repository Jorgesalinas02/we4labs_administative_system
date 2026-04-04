"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { dataTable as dt } from "@/lib/data-table-classes";

export type CashMovementRow = {
  id: string;
  occurredOn: string;
  kind: string;
  category: string;
  amount: string | number;
  isProjection: boolean;
};

function money(n: string | number) {
  const x = typeof n === "string" ? Number(n) : n;
  return x.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

function includesI(hay: string, needle: string) {
  if (!needle.trim()) return true;
  return hay.toLowerCase().includes(needle.trim().toLowerCase());
}

export function CashMovementsTable({ rows }: { rows: CashMovementRow[] }) {
  const [fFecha, setFFecha] = useState("");
  const [fTipo, setFTipo] = useState("");
  const [fCat, setFCat] = useState("");
  const [fMonto, setFMonto] = useState("");
  const [fProy, setFProy] = useState("");

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (fFecha.trim() && !r.occurredOn.includes(fFecha.trim())) return false;
      if (fTipo === "inflow" && r.kind !== "inflow") return false;
      if (fTipo === "outflow" && r.kind !== "outflow") return false;
      if (!includesI(r.category, fCat)) return false;
      if (fMonto.trim()) {
        const m = money(r.amount).replace(/\s/g, "");
        if (!m.includes(fMonto.replace(/\s/g, ""))) return false;
      }
      if (fProy === "si" && !r.isProjection) return false;
      if (fProy === "no" && r.isProjection) return false;
      return true;
    });
  }, [rows, fFecha, fTipo, fCat, fMonto, fProy]);

  return (
    <div className="overflow-x-auto">
      <p className="border-b border-zinc-200 bg-zinc-50/80 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400">
        Los filtros se combinan (AND).
      </p>
      <table className={dt.table}>
        <thead>
          <tr className={dt.trHeadLabels}>
            <th className={cn(dt.thLabel, "whitespace-nowrap")}>Fecha</th>
            <th className={dt.thLabel}>Tipo</th>
            <th className={dt.thLabel}>Categoría</th>
            <th className={cn(dt.thLabel, dt.thLabelRight)}>Monto</th>
            <th className={dt.thLabel}>Proy.</th>
          </tr>
          <tr className={dt.trHeadFilters}>
            <th className={dt.thFilter}>
              <input
                className={dt.filterInput}
                placeholder="AAAA-MM-DD"
                value={fFecha}
                onChange={(e) => setFFecha(e.target.value)}
                aria-label="Filtrar por fecha"
              />
            </th>
            <th className={dt.thFilter}>
              <select
                className={dt.filterSelect}
                value={fTipo}
                onChange={(e) => setFTipo(e.target.value)}
                aria-label="Filtrar por tipo"
              >
                <option value="">Todos</option>
                <option value="inflow">Entrada</option>
                <option value="outflow">Salida</option>
              </select>
            </th>
            <th className={dt.thFilter}>
              <input
                className={dt.filterInput}
                placeholder="Categoría"
                value={fCat}
                onChange={(e) => setFCat(e.target.value)}
                aria-label="Filtrar por categoría"
              />
            </th>
            <th className={dt.thFilter}>
              <input
                className={dt.filterInput}
                placeholder="Texto en monto"
                value={fMonto}
                onChange={(e) => setFMonto(e.target.value)}
                aria-label="Filtrar por monto"
              />
            </th>
            <th className={dt.thFilter}>
              <select
                className={dt.filterSelect}
                value={fProy}
                onChange={(e) => setFProy(e.target.value)}
                aria-label="Filtrar proyección"
              >
                <option value="">Todos</option>
                <option value="si">Sí</option>
                <option value="no">No</option>
              </select>
            </th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r, i) => (
            <tr key={r.id} className={dt.trBody(i)}>
              <td className={dt.td}>{r.occurredOn}</td>
              <td className={dt.td}>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                    r.kind === "inflow"
                      ? "bg-zinc-100 text-zinc-800 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-600"
                      : "bg-zinc-200/80 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100",
                  )}
                >
                  {r.kind === "inflow" ? "Entrada" : "Salida"}
                </span>
              </td>
              <td className={dt.td}>{r.category}</td>
              <td className={cn(dt.td, dt.tdNum)}>{money(r.amount)}</td>
              <td className={dt.td}>{r.isProjection ? "Sí" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="p-4 text-sm text-zinc-500">Sin movimientos. Ejecuta seed o agrega registros.</p>
      )}
      {rows.length > 0 && filtered.length === 0 && (
        <p className="p-4 text-sm text-zinc-500">Ningún movimiento coincide con los filtros.</p>
      )}
    </div>
  );
}
