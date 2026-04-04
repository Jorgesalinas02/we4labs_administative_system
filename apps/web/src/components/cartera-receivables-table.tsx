"use client";

import type { InferSelectModel } from "drizzle-orm";
import { portfolioItems } from "@we4labs/db";
import {
  computeCarteraExcelDiasVencidos,
  computeCarteraExcelEstado,
  type CarteraReceivableRates,
} from "@we4labs/shared";
import { MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CarteraReceivableFormModal } from "@/components/cartera-receivable-form-modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { carteraBalancePending, carteraNum, formatCarteraCop } from "@/lib/cartera-metrics";
import { dataTable as dt } from "@/lib/data-table-classes";

export type CarteraPortfolioRow = InferSelectModel<typeof portfolioItems>;

function dash(v: string | null | undefined) {
  return v?.trim() ? v : "—";
}

function rowDerivedStatus(r: CarteraPortfolioRow, balance: number, todayYmd: string): string {
  if (r.status?.trim()) return r.status.trim();
  const grossPositive = carteraNum(r.grossAmount) > 0 || carteraNum(r.amount) > 0;
  const excel = computeCarteraExcelEstado({
    grossPositive,
    balance,
    dueOn: r.dueOn,
    todayYmd,
  });
  if (excel) return excel;
  return "VIGENTE";
}

function includesI(hay: string, needle: string) {
  if (!needle.trim()) return true;
  return hay.toLowerCase().includes(needle.trim().toLowerCase());
}

function StatusBadge({ status }: { status: string }) {
  const base = "inline-flex max-w-full rounded-full px-2 py-0.5 text-xs font-medium";
  const map: Record<string, string> = {
    COBRADA: "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200",
    VIGENTE:
      "bg-zinc-100 text-zinc-800 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-600",
    VENCIDA: "bg-zinc-200/80 text-zinc-900 dark:bg-zinc-600 dark:text-zinc-100",
    CRÍTICA: "bg-zinc-300 text-zinc-900 dark:bg-zinc-500 dark:text-zinc-950",
    CASTIGAR: "bg-zinc-800 text-white dark:bg-zinc-950 dark:text-zinc-100",
    Parcial: "bg-zinc-100 text-zinc-800 ring-1 ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-200",
  };
  const cls = map[status] ?? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  return <span className={cn(base, cls)}>{status}</span>;
}

const MENU_VIEWPORT_PAD = 8;
/** Altura mínima estimada del menú (editar + eliminar); se ajusta en layout con la medición real. */
const MENU_MIN_HEIGHT_EST = 88;

function placementFromViewport(trigger: DOMRect, menuHeight: number): "above" | "below" {
  const spaceBelow = window.innerHeight - trigger.bottom - MENU_VIEWPORT_PAD;
  const spaceAbove = trigger.top - MENU_VIEWPORT_PAD;
  if (spaceBelow >= menuHeight && spaceAbove >= menuHeight) {
    return spaceBelow >= spaceAbove ? "below" : "above";
  }
  if (spaceBelow >= menuHeight) return "below";
  if (spaceAbove >= menuHeight) return "above";
  return spaceAbove > spaceBelow ? "above" : "below";
}

function ReceivableRowMenu({
  row,
  onDone,
  rates,
  todayYmd,
}: {
  row: CarteraPortfolioRow;
  onDone: () => void;
  rates: CarteraReceivableRates;
  todayYmd: string;
}) {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);
  const [placement, setPlacement] = useState<"above" | "below">("below");
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const btn = buttonRef.current;
    const menu = menuRef.current;
    if (!btn) return;
    const br = btn.getBoundingClientRect();
    const mh = menu?.offsetHeight ?? MENU_MIN_HEIGHT_EST;
    setPlacement(placementFromViewport(br, mh));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function reposition() {
      const btn = buttonRef.current;
      const menu = menuRef.current;
      if (!btn) return;
      const br = btn.getBoundingClientRect();
      const mh = menu?.offsetHeight ?? MENU_MIN_HEIGHT_EST;
      setPlacement(placementFromViewport(br, mh));
    }
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  function toggleMenu() {
    if (open) {
      setOpen(false);
      return;
    }
    const btn = buttonRef.current;
    if (btn) {
      const br = btn.getBoundingClientRect();
      setPlacement(placementFromViewport(br, MENU_MIN_HEIGHT_EST));
    } else {
      setPlacement("below");
    }
    setOpen(true);
  }

  const invoiceLabel =
    row.invoiceRef?.trim() || row.counterparty.trim().slice(0, 48) || "esta factura";

  function openEdit() {
    setOpen(false);
    setEditOpen(true);
  }

  function openConfirmDelete() {
    setDeleteErr(null);
    setOpen(false);
    setConfirmOpen(true);
  }

  function closeConfirm() {
    if (busy) return;
    setConfirmOpen(false);
    setDeleteErr(null);
  }

  async function executeDelete() {
    setDeleteErr(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/cartera/receivables/${row.id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "No se pudo eliminar");
      }
      setConfirmOpen(false);
      onDone();
    } catch (e) {
      setDeleteErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
    <div className="relative flex justify-center" ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        className={cn(
          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900",
          "dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
          open && "bg-zinc-200/80 dark:bg-zinc-800",
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Acciones de la factura"
        disabled={busy}
        onClick={() => toggleMenu()}
      >
        <MoreVertical className="h-4 w-4" aria-hidden />
      </button>
      {open ? (
        <div
          ref={menuRef}
          role="menu"
          className={cn(
            "absolute left-0 z-50 min-w-[10.5rem] rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-950",
            placement === "below" ? "top-full mt-1" : "bottom-full mb-1",
          )}
        >
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
            disabled={busy}
            onClick={openEdit}
          >
            Editar factura
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-zinc-100 dark:text-red-400 dark:hover:bg-zinc-900"
            disabled={busy}
            onClick={openConfirmDelete}
          >
            Eliminar factura
          </button>
        </div>
      ) : null}
    </div>

      <CarteraReceivableFormModal
        open={editOpen}
        mode="edit"
        invoiceId={row.id}
        initial={row}
        rates={rates}
        todayYmd={todayYmd}
        onClose={() => setEditOpen(false)}
        onSaved={onDone}
      />

      {confirmOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeConfirm();
          }}
        >
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60" aria-hidden />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`cartera-del-title-${row.id}`}
            aria-describedby={`cartera-del-desc-${row.id}`}
            className="relative z-10 w-full max-w-md rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <h2
                id={`cartera-del-title-${row.id}`}
                className="text-base font-semibold text-zinc-900 dark:text-zinc-100"
              >
                ¿Eliminar esta factura?
              </h2>
            </div>
            <div className="px-4 py-3">
              <p id={`cartera-del-desc-${row.id}`} className="text-sm text-zinc-600 dark:text-zinc-400">
                Se borrará de cartera la factura{" "}
                <span className="font-medium text-zinc-900 dark:text-zinc-200">«{invoiceLabel}»</span>. Esta acción no
                se puede deshacer.
              </p>
              {deleteErr ? (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400">{deleteErr}</p>
              ) : null}
            </div>
            <div className="flex justify-end gap-2 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <Button type="button" variant="outline" onClick={closeConfirm} disabled={busy}>
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={busy}
                className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
                onClick={() => void executeDelete()}
              >
                {busy ? "Eliminando…" : "Eliminar definitivamente"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function CarteraReceivablesTable({
  rows,
  todayYmd,
  rates,
}: {
  rows: CarteraPortfolioRow[];
  todayYmd: string;
  rates: CarteraReceivableRates;
}) {
  const router = useRouter();
  const [fNum, setFNum] = useState("");
  const [fCliente, setFCliente] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fFactura, setFFactura] = useState("");
  const [fEmision, setFEmision] = useState("");
  const [fVenc, setFVenc] = useState("");
  const [fEstado, setFEstado] = useState("");
  const [fObs, setFObs] = useState("");

  const estadoOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      const bal = carteraBalancePending(r);
      set.add(rowDerivedStatus(r, bal, todayYmd));
    }
    return Array.from(set).sort();
  }, [rows, todayYmd]);

  const filtered = useMemo(() => {
    return rows.filter((r, i) => {
      const balance = carteraBalancePending(r);
      const status = rowDerivedStatus(r, balance, todayYmd);
      const numStr = String(r.sortOrder ?? i + 1);
      if (fNum.trim() && !numStr.includes(fNum.trim())) return false;
      if (!includesI(r.counterparty, fCliente)) return false;
      if (!includesI(r.serviceDescription ?? "", fDesc)) return false;
      if (!includesI(r.invoiceRef ?? "", fFactura)) return false;
      if (fEmision.trim() && !(r.issuedOn ?? "").includes(fEmision.trim())) return false;
      if (fVenc.trim() && !r.dueOn.includes(fVenc.trim())) return false;
      if (fEstado && status !== fEstado) return false;
      if (!includesI(r.notes ?? "", fObs)) return false;
      return true;
    });
  }, [rows, todayYmd, fNum, fCliente, fDesc, fFactura, fEmision, fVenc, fEstado, fObs]);

  const filterCell = (
    <th className={dt.thFilter}>
      <div className="h-8" aria-hidden />
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className={cn(dt.table, "min-w-[1140px]")}>
        <thead>
          <tr className={dt.trHeadLabels}>
            <th className={cn(dt.thLabel, "w-10 px-1")} aria-label="Acciones" />
            <th className={cn(dt.thLabel, dt.thLabelNarrow)}>#</th>
            <th className={dt.thLabel}>Cliente</th>
            <th className={dt.thLabel}>Descripción del servicio</th>
            <th className={dt.thLabel}>N° Factura</th>
            <th className={cn(dt.thLabel, "whitespace-nowrap")}>Fecha emisión</th>
            <th className={cn(dt.thLabel, "whitespace-nowrap")}>Fecha vencimiento</th>
            <th className={cn(dt.thLabel, dt.thLabelRight)}>Valor bruto</th>
            <th className={cn(dt.thLabel, dt.thLabelRight)}>IVA cobrado</th>
            <th className={cn(dt.thLabel, dt.thLabelRight)}>Retefuente desc.</th>
            <th className={cn(dt.thLabel, dt.thLabelRight)}>ReteICA desc.</th>
            <th className={cn(dt.thLabel, dt.thLabelRight)}>Neto a cobrar</th>
            <th className={cn(dt.thLabel, dt.thLabelRight)}>Pagado</th>
            <th className={cn(dt.thLabel, dt.thLabelRight)}>Saldo pendiente</th>
            <th className={cn(dt.thLabel, dt.thLabelRight)}>Días vencidos</th>
            <th className={dt.thLabel}>Estado</th>
            <th className={dt.thLabel}>Observaciones</th>
          </tr>
          <tr className={dt.trHeadFilters}>
            <th className={dt.thFilter}>
              <div className="h-8 w-8" aria-hidden />
            </th>
            <th className={dt.thFilter}>
              <input
                className={dt.filterInput}
                placeholder="#"
                value={fNum}
                onChange={(e) => setFNum(e.target.value)}
                aria-label="Filtrar por número de fila"
              />
            </th>
            <th className={dt.thFilter}>
              <input
                className={dt.filterInput}
                placeholder="Cliente"
                value={fCliente}
                onChange={(e) => setFCliente(e.target.value)}
                aria-label="Filtrar por cliente"
              />
            </th>
            <th className={dt.thFilter}>
              <input
                className={dt.filterInput}
                placeholder="Descripción"
                value={fDesc}
                onChange={(e) => setFDesc(e.target.value)}
                aria-label="Filtrar por descripción"
              />
            </th>
            <th className={dt.thFilter}>
              <input
                className={dt.filterInput}
                placeholder="Factura"
                value={fFactura}
                onChange={(e) => setFFactura(e.target.value)}
                aria-label="Filtrar por factura"
              />
            </th>
            <th className={dt.thFilter}>
              <input
                className={dt.filterInput}
                placeholder="AAAA-MM-DD"
                value={fEmision}
                onChange={(e) => setFEmision(e.target.value)}
                aria-label="Filtrar por fecha emisión"
              />
            </th>
            <th className={dt.thFilter}>
              <input
                className={dt.filterInput}
                placeholder="AAAA-MM-DD"
                value={fVenc}
                onChange={(e) => setFVenc(e.target.value)}
                aria-label="Filtrar por fecha vencimiento"
              />
            </th>
            {filterCell}
            {filterCell}
            {filterCell}
            {filterCell}
            {filterCell}
            {filterCell}
            {filterCell}
            {filterCell}
            <th className={dt.thFilter}>
              <select
                className={dt.filterSelect}
                value={fEstado}
                onChange={(e) => setFEstado(e.target.value)}
                aria-label="Filtrar por estado"
              >
                <option value="">Todos</option>
                {estadoOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </th>
            <th className={dt.thFilter}>
              <input
                className={dt.filterInput}
                placeholder="Observaciones"
                value={fObs}
                onChange={(e) => setFObs(e.target.value)}
                aria-label="Filtrar por observaciones"
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r, i) => {
            const balance = carteraBalancePending(r);
            const grossPositive = carteraNum(r.grossAmount) > 0 || carteraNum(r.amount) > 0;
            const diasMora = computeCarteraExcelDiasVencidos({
              grossPositive,
              balance,
              dueOn: r.dueOn,
              todayYmd,
            });
            const status = rowDerivedStatus(r, balance, todayYmd);
            const gross = carteraNum(r.grossAmount);
            const iva = carteraNum(r.ivaAmount);
            const rf = carteraNum(r.retefuenteAmount);
            const ri = carteraNum(r.reteicaAmount);
            const net = carteraNum(r.amount);
            const paid = carteraNum(r.paidAmount);
            const origIdx = rows.indexOf(r);
            return (
              <tr key={r.id} className={dt.trBody(i)}>
                <td className={cn(dt.td, "w-10 px-1 py-2 align-middle")}>
                  <ReceivableRowMenu
                    row={r}
                    rates={rates}
                    todayYmd={todayYmd}
                    onDone={() => router.refresh()}
                  />
                </td>
                <td className={cn(dt.td, dt.tdNum)}>{r.sortOrder ?? origIdx + 1}</td>
                <td className={dt.td}>{r.counterparty}</td>
                <td className={dt.td}>{dash(r.serviceDescription)}</td>
                <td className={dt.td}>{dash(r.invoiceRef)}</td>
                <td className={dt.td}>{dash(r.issuedOn)}</td>
                <td className={dt.td}>{r.dueOn}</td>
                <td className={cn(dt.td, dt.tdNum)}>{gross > 0 ? formatCarteraCop(gross) : "—"}</td>
                <td className={cn(dt.td, dt.tdNum)}>{iva > 0 ? formatCarteraCop(iva) : "—"}</td>
                <td className={cn(dt.td, dt.tdNum)}>{rf > 0 ? formatCarteraCop(rf) : "—"}</td>
                <td className={cn(dt.td, dt.tdNum)}>{ri > 0 ? formatCarteraCop(ri) : "—"}</td>
                <td className={cn(dt.td, dt.tdNum)}>{formatCarteraCop(net)}</td>
                <td className={cn(dt.td, dt.tdNum)}>{formatCarteraCop(paid)}</td>
                <td className={cn(dt.td, dt.tdNum)}>{formatCarteraCop(balance)}</td>
                <td className={cn(dt.td, dt.tdNum)}>{diasMora != null ? diasMora : "—"}</td>
                <td className={dt.td}>
                  <StatusBadge status={status} />
                </td>
                <td className={cn(dt.td, dt.tdTruncate)} title={r.notes ?? undefined}>
                  {dash(r.notes)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && <p className="p-4 text-sm text-zinc-500">Sin cuentas por cobrar.</p>}
      {rows.length > 0 && filtered.length === 0 && (
        <p className="p-4 text-sm text-zinc-500">Ningún documento coincide con los filtros.</p>
      )}
    </div>
  );
}
