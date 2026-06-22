"use client";

import { useMemo, useState, useCallback } from "react";
import type { BusinessCategoryRecord, CashFlowEntry, CategoryEntrySums, ClientRecord } from "@/lib/data";
import { CopAmountInput } from "@/components/cop-amount-input";
import { cn } from "@/lib/cn";
import { Plus, X, Trash2, ChevronLeft, ChevronRight, UserCircle } from "lucide-react";
import { DatePickerInput } from "@/components/date-picker-input";

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n === 0 ? "—" : n.toLocaleString("es-CO", { maximumFractionDigits: 0 });
}
function fmtBold(n: number) {
  return `$${n.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
}
function fmtDate(d: string | null) {
  if (!d) return null;
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

// ─── Entry input modal ───────────────────────────────────────────────────────

type EntryDraft = Omit<CashFlowEntry, "id" | "createdAt"> & { id?: string };

type EntryModalProps = {
  parentLabel: string;
  subcategories: BusinessCategoryRecord[];
  months: string[];
  monthLabels: string[];
  entries: CashFlowEntry[];
  /** Solo se muestra en ingresos */
  clients?: ClientRecord[];
  kind: "income" | "expense";
  onAdd: (entry: EntryDraft) => Promise<CashFlowEntry | null>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
};

function EntryModal({
  parentLabel,
  subcategories,
  months,
  monthLabels,
  entries,
  clients = [],
  kind,
  onAdd,
  onDelete,
  onClose,
}: EntryModalProps) {
  const todayYm = new Date().toISOString().slice(0, 7);
  const defaultIdx = Math.max(0, months.findIndex((m) => m >= todayYm));

  const [monthIdx, setMonthIdx] = useState(defaultIdx);
  const [selectedCode, setSelectedCode] = useState(subcategories[0]?.code ?? "");
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [occurredOn, setOccurredOn] = useState(""); // YYYY-MM-DD
  const [clientId, setClientId] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const clientLabel = kind === "income" ? "Cliente" : "Proveedor";
  const showClientPicker = true; // visible siempre; la lista puede estar vacía

  const selectedYm = months[monthIdx]!;
  const monthEntriesForCode = entries.filter(
    (e) => e.categoryCode === selectedCode && e.periodYm === selectedYm,
  );
  const monthTotalForCode = monthEntriesForCode.reduce((s, e) => s + e.amount, 0);

  function prevMonth() { setMonthIdx((i) => Math.max(0, i - 1)); }
  function nextMonth() { setMonthIdx((i) => Math.min(months.length - 1, i + 1)); }

  async function handleAdd() {
    if (!selectedCode || amount <= 0) { setErr("Selecciona una categoría e ingresa un monto mayor a 0."); return; }
    setErr(null);
    setSaving(true);
    try {
      await onAdd({
        categoryCode: selectedCode,
        periodYm: selectedYm,
        occurredOn: occurredOn || null,
        description: description.trim() || null,
        amount,
        clientId: clientId || null,
      });
      setAmount(0);
      setDescription("");
      setOccurredOn("");
      setClientId("");
    } catch (e) {
      setErr(String(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try { await onDelete(id); }
    catch (e) { setErr(String(e)); }
    finally { setDeletingId(null); }
  }

  const inputCls = "h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Registrar transacción</p>
            <h3 className="mt-0.5 text-base font-semibold text-zinc-900 dark:text-zinc-100">{parentLabel}</h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* Month selector */}
          <div className="flex items-center justify-between">
            <button onClick={prevMonth} disabled={monthIdx === 0}
              className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <select
              value={selectedYm}
              onChange={(e) => setMonthIdx(months.indexOf(e.target.value))}
              className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {months.map((ym, i) => (
                <option key={ym} value={ym}>{monthLabels[i]}</option>
              ))}
            </select>
            <button onClick={nextMonth} disabled={monthIdx === months.length - 1}
              className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Subcategory */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">Subcategoría</label>
            <select
              value={selectedCode}
              onChange={(e) => setSelectedCode(e.target.value)}
              className={cn(inputCls, "w-full")}
            >
              {subcategories.map((s) => (
                <option key={s.code} value={s.code}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* New entry form */}
          <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/40 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Nueva transacción</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Fecha (opcional)</label>
                <DatePickerInput
                  value={occurredOn}
                  onChange={(iso) => {
                    setOccurredOn(iso);
                    // Sincronizar el mes del selector con la fecha elegida
                    if (iso) {
                      const ym = iso.slice(0, 7); // YYYY-MM
                      const idx = months.indexOf(ym);
                      if (idx !== -1) setMonthIdx(idx);
                    }
                  }}
                  placeholder="Seleccionar fecha"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Monto (COP)</label>
                <CopAmountInput
                  value={amount}
                  onCommit={setAmount}
                  className={cn(inputCls, "w-full text-right")}
                />
              </div>
            </div>
            {/* Selector de cliente / proveedor */}
            {showClientPicker && (
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  <UserCircle className="h-3.5 w-3.5" />
                  {clientLabel} (opcional)
                </label>
                {clients.length === 0 ? (
                  <p className="text-xs text-zinc-400">
                    No hay {kind === "income" ? "clientes" : "proveedores"} registrados.{" "}
                    <a href="/clientes" className="underline hover:text-zinc-600">
                      Añadir en Clientes →
                    </a>
                  </p>
                ) : (
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className={cn(inputCls, "w-full")}
                  >
                    <option value="">— Sin {clientLabel.toLowerCase()} asociado —</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}{c.nit ? ` · ${c.nit}` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs text-zinc-500">Descripción (opcional)</label>
              <input
                type="text"
                placeholder="Ej. Factura #001 — servicio de consultoría"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void handleAdd(); }}
                className={cn(inputCls, "w-full")}
              />
            </div>
            {err && <p className="text-xs text-red-500">{err}</p>}
            <button
              onClick={() => void handleAdd()}
              disabled={saving || amount <= 0}
              className="flex w-full items-center justify-center gap-1.5 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Plus className="h-4 w-4" />
              {saving ? "Guardando…" : "Agregar transacción"}
            </button>
          </div>

          {/* Existing entries for selected code + month */}
          {monthEntriesForCode.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                  Registrado en {monthLabels[monthIdx]}
                </p>
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Total: {fmtBold(monthTotalForCode)}
                </span>
              </div>
              <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                {monthEntriesForCode.map((e) => {
                  const clientName = e.clientId ? clients.find((c) => c.id === e.clientId)?.name : null;
                  return (
                  <div key={e.id} className="flex items-start justify-between gap-2 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium tabular-nums text-zinc-800 dark:text-zinc-200">
                        {fmtBold(e.amount)}
                      </p>
                      {clientName && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                          <UserCircle className="h-3 w-3 shrink-0" />
                          {clientName}
                        </p>
                      )}
                      {e.description && (
                        <p className="mt-0.5 truncate text-xs text-zinc-500">{e.description}</p>
                      )}
                      {e.occurredOn && (
                        <p className="text-xs text-zinc-400">{fmtDate(e.occurredOn)}</p>
                      )}
                    </div>
                    <button
                      onClick={() => void handleDelete(e.id)}
                      disabled={deletingId === e.id}
                      className="mt-0.5 shrink-0 rounded p-1 text-zinc-300 hover:bg-red-50 hover:text-red-500 disabled:opacity-30 dark:text-zinc-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Table sub-components ────────────────────────────────────────────────────

function SectionHeader({ label, colCount }: { label: string; colCount: number }) {
  return (
    <tr>
      <td
        colSpan={colCount + 2}
        className="sticky left-0 z-10 bg-zinc-100 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
      >
        {label}
      </td>
    </tr>
  );
}

type GroupRowProps = {
  label: string;
  months: string[];
  sums: CategoryEntrySums;
  codes: string[];
  onAdd: () => void;
};

function GroupRow({ label, months, sums, codes, onAdd }: GroupRowProps) {
  return (
    <tr className="border-b border-zinc-100 hover:bg-zinc-50/60 dark:border-zinc-800 dark:hover:bg-zinc-800/20">
      <td className="sticky left-0 z-10 min-w-[220px] max-w-[260px] border-r border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-2">
          <button
            onClick={onAdd}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-zinc-300 text-zinc-400 hover:border-zinc-500 hover:bg-zinc-100 hover:text-zinc-600 dark:border-zinc-600 dark:hover:bg-zinc-800"
          >
            <Plus className="h-3 w-3" />
          </button>
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{label}</span>
        </div>
      </td>
      {months.map((ym) => {
        const v = codes.reduce((s, c) => s + (sums[c]?.[ym] ?? 0), 0);
        return (
          <td key={ym} className="border-r border-zinc-100 px-2.5 py-2 text-right text-sm tabular-nums text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
            {fmt(v)}
          </td>
        );
      })}
      <td className="border-l border-zinc-200 px-3 py-2 text-right text-sm font-semibold tabular-nums text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
        {(() => { const t = months.reduce((s, ym) => s + codes.reduce((ss, c) => ss + (sums[c]?.[ym] ?? 0), 0), 0); return t === 0 ? "—" : fmtBold(t); })()}
      </td>
    </tr>
  );
}

function TotalRow({ label, totals, months, annual, positive }: {
  label: string; totals: Record<string, number>; months: string[]; annual: number; positive?: boolean;
}) {
  return (
    <tr className="border-y border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50">
      <td className="sticky left-0 z-10 min-w-[220px] max-w-[260px] border-r border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
        {label}
      </td>
      {months.map((ym) => (
        <td key={ym} className={cn("border-r border-zinc-200 px-2.5 py-2 text-right text-sm font-semibold tabular-nums dark:border-zinc-800",
          positive ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
          {fmtBold(totals[ym] ?? 0)}
        </td>
      ))}
      <td className="border-l border-zinc-200 px-3 py-2 text-right text-sm font-bold tabular-nums text-zinc-900 dark:border-zinc-800 dark:text-zinc-100">
        {fmtBold(annual)}
      </td>
    </tr>
  );
}

function ComputedRow({ label, values, months, highlight }: {
  label: string; values: Record<string, number>; months: string[]; highlight?: boolean;
}) {
  return (
    <tr className={cn("border-b border-zinc-200 dark:border-zinc-800", highlight && "bg-zinc-50 dark:bg-zinc-900/40")}>
      <td className={cn("sticky left-0 z-10 min-w-[220px] max-w-[260px] border-r border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800",
        highlight ? "font-bold bg-zinc-50 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" : "bg-white text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300")}>
        {label}
      </td>
      {months.map((ym) => {
        const v = values[ym] ?? 0;
        return (
          <td key={ym} className={cn("border-r border-zinc-100 px-2.5 py-2 text-right text-sm tabular-nums dark:border-zinc-800",
            highlight ? (v < 0 ? "font-bold text-red-600 dark:text-red-400" : "font-bold text-zinc-900 dark:text-zinc-100") : "text-zinc-600 dark:text-zinc-400")}>
            {fmtBold(v)}
          </td>
        );
      })}
      <td className="border-l border-zinc-200 px-3 py-2 text-right text-sm font-semibold tabular-nums text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
        {fmtBold(months.reduce((s, ym) => s + (values[ym] ?? 0), 0))}
      </td>
    </tr>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type OpenModal = { parentCode: string; parentLabel: string; kind: "income" | "expense" };

type Props = {
  incomeCategories: BusinessCategoryRecord[];
  expenseCategories: BusinessCategoryRecord[];
  initialSums: CategoryEntrySums;
  initialEntries: CashFlowEntry[];
  months: string[];
  monthLabels: string[];
  saldoInicial: number;
  clients?: ClientRecord[];
};

export function CashFlowCategoryMatrix({
  incomeCategories,
  expenseCategories,
  initialSums,
  initialEntries,
  months,
  monthLabels,
  saldoInicial,
  clients = [],
}: Props) {
  const [sums, setSums] = useState<CategoryEntrySums>(initialSums);
  const [entries, setEntries] = useState<CashFlowEntry[]>(initialEntries);
  const [openModal, setOpenModal] = useState<OpenModal | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const incomeGroups = useMemo(() => {
    const map = new Map<string, { label: string; codes: BusinessCategoryRecord[] }>();
    for (const c of incomeCategories) {
      const g = map.get(c.parentCode) ?? { label: c.parentLabel, codes: [] };
      g.codes.push(c);
      map.set(c.parentCode, g);
    }
    return [...map.entries()];
  }, [incomeCategories]);

  const expenseGroups = useMemo(() => {
    const map = new Map<string, { label: string; codes: BusinessCategoryRecord[] }>();
    for (const c of expenseCategories) {
      const g = map.get(c.parentCode) ?? { label: c.parentLabel, codes: [] };
      g.codes.push(c);
      map.set(c.parentCode, g);
    }
    return [...map.entries()];
  }, [expenseCategories]);

  const incomeTotals = useMemo(
    () => Object.fromEntries(months.map((ym) => [ym, incomeCategories.reduce((s, c) => s + (sums[c.code]?.[ym] ?? 0), 0)])),
    [sums, incomeCategories, months],
  );
  const expenseTotals = useMemo(
    () => Object.fromEntries(months.map((ym) => [ym, expenseCategories.reduce((s, c) => s + (sums[c.code]?.[ym] ?? 0), 0)])),
    [sums, expenseCategories, months],
  );
  const flujoNeto = useMemo(
    () => Object.fromEntries(months.map((ym) => [ym, (incomeTotals[ym] ?? 0) - (expenseTotals[ym] ?? 0)])),
    [incomeTotals, expenseTotals, months],
  );
  const saldoFinal = useMemo(() => {
    const result: Record<string, number> = {};
    let running = saldoInicial;
    for (const ym of months) {
      running += flujoNeto[ym] ?? 0;
      result[ym] = running;
    }
    return result;
  }, [flujoNeto, months, saldoInicial]);

  const handleAdd = useCallback(async (entry: Omit<CashFlowEntry, "id" | "createdAt"> & { id?: string }) => {
    setErr(null);
    const res = await fetch("/api/cash-flow-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(body.error ?? "No se pudo guardar");
    }
    const saved = await res.json() as CashFlowEntry;
    const newEntry: CashFlowEntry = { ...saved, amount: Number(saved.amount) };
    setEntries((prev) => [...prev, newEntry]);
    setSums((prev) => {
      const code = newEntry.categoryCode;
      const ym = newEntry.periodYm;
      return { ...prev, [code]: { ...(prev[code] ?? {}), [ym]: (prev[code]?.[ym] ?? 0) + newEntry.amount } };
    });
    return newEntry;
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    setErr(null);
    const entry = entries.find((e) => e.id === id);
    const res = await fetch(`/api/cash-flow-entries?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(body.error ?? "No se pudo eliminar");
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (entry) {
      setSums((prev) => {
        const code = entry.categoryCode;
        const ym = entry.periodYm;
        const newVal = (prev[code]?.[ym] ?? 0) - entry.amount;
        return { ...prev, [code]: { ...(prev[code] ?? {}), [ym]: Math.max(0, newVal) } };
      });
    }
  }, [entries]);

  const modalSubcats = useMemo(() => {
    if (!openModal) return [];
    const source = openModal.kind === "income" ? incomeCategories : expenseCategories;
    return source.filter((c) => c.parentCode === openModal.parentCode);
  }, [openModal, incomeCategories, expenseCategories]);

  const TH = "min-w-[120px] border-r border-zinc-200 px-2.5 py-2.5 text-right font-medium whitespace-nowrap tabular-nums tracking-tight text-zinc-500 dark:border-zinc-800 dark:text-zinc-400";

  return (
    <div className="space-y-3">
      {err && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">{err}</p>
      )}

      <div className="w-full overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <table className="min-w-[1400px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
              <th className="sticky left-0 z-20 min-w-[220px] max-w-[260px] border-r border-zinc-200 bg-zinc-50 px-3 py-2.5 text-left font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                Concepto
              </th>
              {monthLabels.map((label, i) => (
                <th key={months[i]} className={TH}>{label}</th>
              ))}
              <th className="min-w-[120px] border-l border-zinc-200 px-3 py-2.5 text-right font-semibold whitespace-nowrap tabular-nums text-zinc-800 dark:border-zinc-800 dark:text-zinc-200">
                Total anual
              </th>
            </tr>
          </thead>
          <tbody>
            {/* INGRESOS */}
            <SectionHeader label="INGRESOS" colCount={months.length} />
            {incomeGroups.map(([parentCode, group]) => (
              <GroupRow
                key={parentCode}
                label={group.label}
                months={months}
                sums={sums}
                codes={group.codes.map((c) => c.code)}
                onAdd={() => setOpenModal({ parentCode, parentLabel: group.label, kind: "income" })}
              />
            ))}
            {incomeCategories.length === 0 && (
              <tr><td colSpan={months.length + 2} className="px-4 py-3 text-sm text-zinc-400 italic">Sin categorías de ingreso. Configúralas en Supuestos.</td></tr>
            )}
            <TotalRow label="TOTAL INGRESOS" totals={incomeTotals} months={months}
              annual={Object.values(incomeTotals).reduce((a, b) => a + b, 0)} positive />

            {/* EGRESOS */}
            <SectionHeader label="EGRESOS" colCount={months.length} />
            {expenseGroups.map(([parentCode, group]) => (
              <GroupRow
                key={parentCode}
                label={group.label}
                months={months}
                sums={sums}
                codes={group.codes.map((c) => c.code)}
                onAdd={() => setOpenModal({ parentCode, parentLabel: group.label, kind: "expense" })}
              />
            ))}
            {expenseCategories.length === 0 && (
              <tr><td colSpan={months.length + 2} className="px-4 py-3 text-sm text-zinc-400 italic">Sin categorías de egreso. Configúralas en Supuestos.</td></tr>
            )}
            <TotalRow label="TOTAL EGRESOS" totals={expenseTotals} months={months}
              annual={Object.values(expenseTotals).reduce((a, b) => a + b, 0)} />

            {/* COMPUTED */}
            <ComputedRow label="Flujo neto del período" values={flujoNeto} months={months} highlight />

            {/* Saldo inicial — solo lectura */}
            <tr className="border-b border-zinc-100 dark:border-zinc-800">
              <td className="sticky left-0 z-10 min-w-[220px] max-w-[260px] border-r border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  Saldo inicial de caja
                  <a href="/supuestos#saldo" className="text-xs text-zinc-400 underline underline-offset-2 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400">
                    ✎ editar
                  </a>
                </span>
              </td>
              {months.map((ym, i) => (
                <td key={ym} className="border-r border-zinc-100 px-2.5 py-2 text-right text-sm tabular-nums text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
                  {i === 0 ? fmtBold(saldoInicial) : "—"}
                </td>
              ))}
              <td className="border-l border-zinc-200 px-3 py-2 text-right text-sm tabular-nums text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
                {fmtBold(saldoInicial)}
              </td>
            </tr>

            <ComputedRow label="Saldo final de caja" values={saldoFinal} months={months} />
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {openModal && (
        <EntryModal
          parentLabel={openModal.parentLabel}
          subcategories={modalSubcats}
          months={months}
          monthLabels={monthLabels}
          entries={entries}
          clients={clients}
          kind={openModal.kind}
          onAdd={handleAdd}
          onDelete={handleDelete}
          onClose={() => setOpenModal(null)}
        />
      )}
    </div>
  );
}
