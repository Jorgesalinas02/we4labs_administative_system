"use client";

import { useState, useMemo, useEffect } from "react";
import type { CostCenterRecord, ClientRecord, CashFlowEntry, BusinessCategoryRecord } from "@/lib/data";
import { useRole } from "@/components/role-provider";
import { cn } from "@/lib/cn";
import {
  Plus, X, Pencil, Trash2, FolderKanban, CalendarDays, User,
  CheckCircle2, PauseCircle, Clock, ArrowUpCircle, ArrowDownCircle,
  ChevronDown, ChevronUp, ChevronRight, Receipt,
} from "lucide-react";
import { CopAmountInput } from "@/components/cop-amount-input";

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `$${n.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
}

function fmtDate(d: string | null) {
  if (!d) return null;
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const STATUS_CONFIG = {
  en_progreso: {
    label: "En progreso",
    icon: Clock,
    cls: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
    bar: "bg-blue-500",
  },
  completado: {
    label: "Completado",
    icon: CheckCircle2,
    cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    bar: "bg-emerald-500",
  },
  pausado: {
    label: "Pausado",
    icon: PauseCircle,
    cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    bar: "bg-amber-400",
  },
} as const;

type Status = keyof typeof STATUS_CONFIG;

// ─── Cost center modal (create / edit) ────────────────────────────────────────

type CostCenterDraft = {
  name: string;
  clientId: string | null;
  quotedAmount: number;
  startDate: string | null;
  endDate: string | null;
  status: Status;
  description: string | null;
};

function CostCenterModal({
  initial,
  clients,
  onSave,
  onClose,
}: {
  initial?: CostCenterRecord | null;
  clients: ClientRecord[];
  onSave: (data: CostCenterDraft) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [clientId, setClientId] = useState(initial?.clientId ?? "");
  const [quotedAmount, setQuotedAmount] = useState(Number(initial?.quotedAmount ?? 0));
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [status, setStatus] = useState<Status>((initial?.status as Status) ?? "en_progreso");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const inputCls = "h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

  async function handleSave() {
    if (!name.trim()) { setErr("El nombre es requerido"); return; }
    setErr(null);
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        clientId: clientId || null,
        quotedAmount,
        startDate: startDate || null,
        endDate: endDate || null,
        status,
        description: description.trim() || null,
      });
      onClose();
    } catch (e) {
      setErr(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">
              {initial ? "Editar proyecto" : "Nuevo proyecto"}
            </p>
            <h3 className="mt-0.5 text-base font-semibold text-zinc-900 dark:text-zinc-100">Centro de costos</h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">Nombre del proyecto *</label>
            <input
              type="text"
              placeholder="Ej. Proyecto Alpha — Diseño web"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500">Estado</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className={inputCls}>
                <option value="en_progreso">En progreso</option>
                <option value="completado">Completado</option>
                <option value="pausado">Pausado</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500">Cliente (opcional)</label>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={inputCls}>
                <option value="">— Sin cliente —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">Costo cotizado (COP)</label>
            <CopAmountInput
              value={quotedAmount}
              onCommit={setQuotedAmount}
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-right dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500">Fecha inicio</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500">Fecha fin</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">Descripción (opcional)</label>
            <textarea
              placeholder="Descripción del proyecto, alcance, observaciones..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 resize-none"
            />
          </div>

          {err && <p className="text-xs text-red-500">{err}</p>}

          <button
            onClick={() => void handleSave()}
            disabled={saving || !name.trim()}
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {saving ? "Guardando…" : initial ? "Guardar cambios" : "Crear proyecto"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Transaction modal ────────────────────────────────────────────────────────

type TransactionDraft = {
  kind: "income" | "expense";
  categoryCode: string;
  amount: number;
  occurredOn: string;
  description: string;
};

function TransactionModal({
  costCenter,
  categories,
  onSave,
  onClose,
}: {
  costCenter: CostCenterRecord;
  categories: BusinessCategoryRecord[];
  onSave: (entry: CashFlowEntry) => void;
  onClose: () => void;
}) {
  const [kind, setKind] = useState<"income" | "expense">("expense");
  const [selectedParent, setSelectedParent] = useState("");
  const [categoryCode, setCategoryCode] = useState("");
  const [amount, setAmount] = useState(0);
  const [occurredOn, setOccurredOn] = useState(todayStr());
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.kind === kind),
    [categories, kind],
  );

  const parentCategories = useMemo(() => {
    const seen = new Set<string>();
    const parents: { code: string; label: string }[] = [];
    for (const c of filteredCategories) {
      if (!seen.has(c.parentCode)) {
        seen.add(c.parentCode);
        parents.push({ code: c.parentCode, label: c.parentLabel });
      }
    }
    return parents;
  }, [filteredCategories]);

  const subcategories = useMemo(
    () => filteredCategories.filter((c) => c.parentCode === selectedParent),
    [filteredCategories, selectedParent],
  );

  useEffect(() => {
    setSelectedParent("");
    setCategoryCode("");
  }, [kind]);

  const inputCls = "h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

  async function handleSave() {
    if (!categoryCode) { setErr("Selecciona una categoría"); return; }
    if (amount <= 0) { setErr("El monto debe ser mayor a 0"); return; }
    setErr(null);
    setSaving(true);
    try {
      const periodYm = occurredOn.slice(0, 7);
      const res = await fetch("/api/cash-flow-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryCode,
          periodYm,
          occurredOn,
          description: description.trim() || null,
          amount,
          costCenterId: costCenter.id,
          clientId: costCenter.clientId ?? null,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "No se pudo guardar");
      }
      const raw = (await res.json()) as Record<string, unknown>;
      onSave({
        id: raw.id as string,
        categoryCode: raw.categoryCode as string,
        periodYm: raw.periodYm as string,
        occurredOn: typeof raw.occurredOn === "string" ? raw.occurredOn : null,
        description: typeof raw.description === "string" ? raw.description : null,
        amount: Number(raw.amount),
        clientId: typeof raw.clientId === "string" ? raw.clientId : null,
        teamMemberId: typeof raw.teamMemberId === "string" ? raw.teamMemberId : null,
        costCenterId: typeof raw.costCenterId === "string" ? raw.costCenterId : null,
        createdAt: raw.createdAt ? new Date(raw.createdAt as string) : null,
      });
      onClose();
    } catch (e) {
      setErr(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Registrar transacción</p>
            <h3 className="mt-0.5 text-base font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
              {costCenter.name}
            </h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {/* Kind toggle */}
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
            {(["expense", "income"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition-colors",
                  kind === k
                    ? k === "income"
                      ? "bg-white text-emerald-700 shadow-sm dark:bg-zinc-800 dark:text-emerald-400"
                      : "bg-white text-red-600 shadow-sm dark:bg-zinc-800 dark:text-red-400"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300",
                )}
              >
                {k === "income"
                  ? <ArrowUpCircle className="h-3.5 w-3.5" />
                  : <ArrowDownCircle className="h-3.5 w-3.5" />}
                {k === "income" ? "Ingreso" : "Egreso"}
              </button>
            ))}
          </div>

          {/* Category accordion */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-500">Categoría</label>
            {filteredCategories.length === 0 ? (
              <p className="text-xs text-zinc-400">
                No hay categorías de {kind === "income" ? "ingreso" : "egreso"} configuradas.
              </p>
            ) : (
              <>
                <div className="max-h-56 overflow-y-auto rounded-lg border border-zinc-100 dark:border-zinc-800">
                  {parentCategories.map((p, i) => {
                    const subs = filteredCategories.filter((c) => c.parentCode === p.code);
                    const isOpen = selectedParent === p.code;
                    const isLast = i === parentCategories.length - 1;
                    return (
                      <div
                        key={p.code}
                        className={cn(!isLast && "border-b border-zinc-100 dark:border-zinc-800")}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (isOpen) {
                              setSelectedParent("");
                            } else {
                              setSelectedParent(p.code);
                              if (!subs.some((s) => s.code === categoryCode)) {
                                setCategoryCode(subs[0]?.code ?? "");
                              }
                            }
                          }}
                          className={cn(
                            "flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors",
                            isOpen && "bg-zinc-50 dark:bg-zinc-900/40",
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={cn(
                                "h-1.5 w-1.5 shrink-0 rounded-full",
                                isOpen
                                  ? kind === "income"
                                    ? "bg-emerald-500"
                                    : "bg-red-500"
                                  : "bg-zinc-300 dark:bg-zinc-600",
                              )}
                            />
                            <span
                              className={cn(
                                "text-sm",
                                isOpen
                                  ? "font-medium text-zinc-900 dark:text-zinc-100"
                                  : "text-zinc-500 dark:text-zinc-400",
                              )}
                            >
                              {p.label}
                            </span>
                          </div>
                          {isOpen
                            ? <ChevronUp className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                            : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-300 dark:text-zinc-600" />}
                        </button>

                        {isOpen && (
                          <div className="flex flex-wrap gap-1.5 px-3 pb-3 pt-0.5">
                            {subs.map((sub) => (
                              <button
                                key={sub.code}
                                type="button"
                                onClick={() => setCategoryCode(sub.code)}
                                className={cn(
                                  "rounded-md border px-2.5 py-1 text-xs transition-colors",
                                  categoryCode === sub.code
                                    ? kind === "income"
                                      ? "border-emerald-400 bg-emerald-50 text-emerald-700 font-medium dark:border-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                                      : "border-red-300 bg-red-50 text-red-700 font-medium dark:border-red-700 dark:bg-red-950/30 dark:text-red-400"
                                    : "border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500",
                                )}
                              >
                                {sub.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Breadcrumb de selección */}
                {categoryCode && (
                  <div className="flex items-center gap-1.5 rounded-md bg-zinc-50 px-2.5 py-1.5 text-xs dark:bg-zinc-900/40">
                    <FolderKanban className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    <span className="text-zinc-400">
                      {parentCategories.find((p) => p.code === selectedParent)?.label}
                    </span>
                    <ChevronRight className="h-3 w-3 shrink-0 text-zinc-300" />
                    <span
                      className={cn(
                        "font-medium",
                        kind === "income"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400",
                      )}
                    >
                      {filteredCategories.find((c) => c.code === categoryCode)?.label}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">Monto (COP)</label>
            <CopAmountInput
              value={amount}
              onCommit={setAmount}
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-right dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>

          {/* Date */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">Fecha</label>
            <input
              type="date"
              value={occurredOn}
              onChange={(e) => setOccurredOn(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">Descripción (opcional)</label>
            <input
              type="text"
              placeholder="Ej. Factura #123 — proveedor"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputCls}
            />
          </div>

          {err && <p className="text-xs text-red-500">{err}</p>}

          <button
            onClick={() => void handleSave()}
            disabled={saving || !categoryCode || amount <= 0}
            className={cn(
              "flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-white disabled:opacity-40",
              kind === "income"
                ? "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                : "bg-zinc-900 hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200",
            )}
          >
            {saving ? "Guardando…" : `Registrar ${kind === "income" ? "ingreso" : "egreso"}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────

type CardProps = {
  center: CostCenterRecord;
  entries: CashFlowEntry[];
  categoryKindMap: Map<string, "income" | "expense">;
  categoryLabelMap: Map<string, string>;
  clientName: string | null;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onAddTransaction: () => void;
  onDeleteTransaction: (id: string) => void;
};

function CostCenterCard({
  center,
  entries,
  categoryKindMap,
  categoryLabelMap,
  clientName,
  isAdmin,
  onEdit,
  onDelete,
  onAddTransaction,
  onDeleteTransaction,
}: CardProps) {
  const [showTxns, setShowTxns] = useState(false);
  const [deletingTxnId, setDeletingTxnId] = useState<string | null>(null);

  const quoted = Number(center.quotedAmount);
  const statusCfg = STATUS_CONFIG[(center.status as Status) ?? "en_progreso"] ?? STATUS_CONFIG.en_progreso;
  const StatusIcon = statusCfg.icon;

  const ingresos = useMemo(
    () => entries.filter((e) => (categoryKindMap.get(e.categoryCode) ?? "expense") === "income").reduce((s, e) => s + e.amount, 0),
    [entries, categoryKindMap],
  );
  const egresos = useMemo(
    () => entries.filter((e) => (categoryKindMap.get(e.categoryCode) ?? "expense") === "expense").reduce((s, e) => s + e.amount, 0),
    [entries, categoryKindMap],
  );
  const balance = ingresos - egresos;
  const pct = quoted > 0 ? Math.min((egresos / quoted) * 100, 100) : 0;
  const overBudget = quoted > 0 && egresos > quoted;

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => {
      const da = a.occurredOn ?? a.createdAt?.toISOString().slice(0, 10) ?? "";
      const db2 = b.occurredOn ?? b.createdAt?.toISOString().slice(0, 10) ?? "";
      return db2.localeCompare(da);
    }),
    [entries],
  );

  async function handleDeleteTxn(id: string) {
    setDeletingTxnId(id);
    try {
      const res = await fetch(`/api/cash-flow-entries?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      onDeleteTransaction(id);
    } catch {
      // entry stays in list on error
    } finally {
      setDeletingTxnId(null);
    }
  }

  return (
    <div className="group flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900">
            <FolderKanban className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">{center.name}</p>
            {clientName && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                <User className="h-3 w-3 shrink-0" />
                {clientName}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", statusCfg.cls)}>
            <StatusIcon className="h-3 w-3" />
            {statusCfg.label}
          </span>
          {isAdmin && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={onEdit} className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={onDelete} className="rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {center.description && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
          {center.description}
        </p>
      )}

      {/* Ingresos / Egresos breakdown */}
      <div className="grid grid-cols-3 gap-2 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900/40">
        <div>
          <p className="flex items-center gap-1 text-xs text-zinc-400">
            <ArrowUpCircle className="h-3 w-3 text-emerald-500" />
            Ingresos
          </p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {fmt(ingresos)}
          </p>
        </div>
        <div>
          <p className="flex items-center gap-1 text-xs text-zinc-400">
            <ArrowDownCircle className="h-3 w-3 text-red-500" />
            Egresos
          </p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-red-600 dark:text-red-400">
            {fmt(egresos)}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-400">Balance</p>
          <p className={cn(
            "mt-0.5 text-sm font-semibold tabular-nums",
            balance >= 0 ? "text-zinc-700 dark:text-zinc-200" : "text-red-600 dark:text-red-400",
          )}>
            {balance >= 0 ? fmt(balance) : `-${fmt(Math.abs(balance))}`}
          </p>
        </div>
      </div>

      {/* Budget progress (egresos vs quoted) */}
      {quoted > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Presupuesto consumido</span>
            <span className={cn("font-medium tabular-nums", overBudget ? "text-red-600 dark:text-red-400" : "text-zinc-500")}>
              {pct.toFixed(0)}% de {fmt(quoted)}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", overBudget ? "bg-red-500" : statusCfg.bar)}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Dates */}
      {(center.startDate || center.endDate) && (
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
          <CalendarDays className="h-3 w-3 shrink-0" />
          {fmtDate(center.startDate ?? null)}
          {center.startDate && center.endDate && <span>→</span>}
          {fmtDate(center.endDate ?? null)}
        </div>
      )}

      {/* Footer: transactions toggle + add button */}
      <div className="flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800 -mb-1">
        <button
          onClick={() => setShowTxns((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          <Receipt className="h-3.5 w-3.5" />
          {entries.length === 0
            ? "Sin transacciones"
            : `${entries.length} transacción${entries.length !== 1 ? "es" : ""}`}
          {entries.length > 0 && (showTxns ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
        </button>
        {isAdmin && (
          <button
            onClick={onAddTransaction}
            className="flex items-center gap-1 rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Plus className="h-3 w-3" />
            Registrar
          </button>
        )}
      </div>

      {/* Transaction list */}
      {showTxns && entries.length > 0 && (
        <div className="max-h-52 overflow-y-auto rounded-lg border border-zinc-100 dark:border-zinc-800 -mt-2">
          {sortedEntries.map((e) => {
            const eKind = categoryKindMap.get(e.categoryCode) ?? "expense";
            const label = categoryLabelMap.get(e.categoryCode) ?? e.categoryCode;
            const dateStr = e.occurredOn ? fmtDate(e.occurredOn) : fmtDate(e.periodYm + "-01");
            return (
              <div
                key={e.id}
                className="group/row flex items-center gap-2 border-b border-zinc-50 px-3 py-2 last:border-0 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
              >
                {eKind === "income"
                  ? <ArrowUpCircle className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  : <ArrowDownCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-zinc-600 dark:text-zinc-400">{label}</p>
                  {e.description && (
                    <p className="truncate text-xs text-zinc-400 dark:text-zinc-500">{e.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <p className={cn(
                      "text-xs font-medium tabular-nums",
                      eKind === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
                    )}>
                      {eKind === "income" ? "+" : "-"}{fmt(e.amount)}
                    </p>
                    <p className="text-xs text-zinc-400">{dateStr}</p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => void handleDeleteTxn(e.id)}
                      disabled={deletingTxnId === e.id}
                      className="rounded p-1 text-zinc-300 opacity-0 group-hover/row:opacity-100 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400 disabled:opacity-30 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

type Props = {
  initialCenters: CostCenterRecord[];
  clients: ClientRecord[];
  entries: CashFlowEntry[];
  categories: BusinessCategoryRecord[];
};

export function CostCentersView({ initialCenters, clients, entries, categories }: Props) {
  const { isAdmin } = useRole();
  const [centers, setCenters] = useState(initialCenters);
  const [localEntries, setLocalEntries] = useState(entries);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CostCenterRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [txnTarget, setTxnTarget] = useState<CostCenterRecord | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c.name])), [clients]);

  const categoryKindMap = useMemo(
    () => new Map(categories.map((c) => [c.code, c.kind as "income" | "expense"])),
    [categories],
  );
  const categoryLabelMap = useMemo(
    () => new Map(categories.map((c) => [c.code, c.label])),
    [categories],
  );

  const entriesByCostCenter = useMemo(() => {
    const map = new Map<string, CashFlowEntry[]>();
    for (const e of localEntries) {
      if (!e.costCenterId) continue;
      const list = map.get(e.costCenterId) ?? [];
      list.push(e);
      map.set(e.costCenterId, list);
    }
    return map;
  }, [localEntries]);

  async function handleCreate(data: CostCenterDraft) {
    const res = await fetch("/api/cost-centers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? "No se pudo crear");
    }
    const created = (await res.json()) as CostCenterRecord;
    setCenters((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
  }

  async function handleUpdate(id: string, data: CostCenterDraft) {
    const res = await fetch("/api/cost-centers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? "No se pudo actualizar");
    }
    const updated = (await res.json()) as CostCenterRecord;
    setCenters((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setErr(null);
    try {
      const res = await fetch(`/api/cost-centers?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "No se pudo eliminar");
      }
      setCenters((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      setErr(String(e));
    } finally {
      setDeletingId(null);
    }
  }

  function handleTransactionAdded(entry: CashFlowEntry) {
    setLocalEntries((prev) => [...prev, entry]);
  }

  function handleTransactionDeleted(id: string) {
    setLocalEntries((prev) => prev.filter((e) => e.id !== id));
  }

  const activeCenters = centers.filter((c) => c.active);

  const totalQuoted = activeCenters.reduce((s, c) => s + Number(c.quotedAmount), 0);
  const totalIngresos = [...entriesByCostCenter.values()].flat().filter(
    (e) => (categoryKindMap.get(e.categoryCode) ?? "expense") === "income",
  ).reduce((s, e) => s + e.amount, 0);
  const totalEgresos = [...entriesByCostCenter.values()].flat().filter(
    (e) => (categoryKindMap.get(e.categoryCode) ?? "expense") === "expense",
  ).reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      {activeCenters.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Proyectos activos", value: String(activeCenters.length), color: "" },
            { label: "Total cotizado", value: fmt(totalQuoted), color: "" },
            { label: "Total ingresos", value: fmt(totalIngresos), color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Total egresos", value: fmt(totalEgresos), color: "text-red-600 dark:text-red-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900/40">
              <p className="text-xs text-zinc-400 dark:text-zinc-500">{label}</p>
              <p className={cn("mt-0.5 text-lg font-semibold tabular-nums", color || "text-zinc-900 dark:text-zinc-100")}>
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {err && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">{err}</p>
      )}

      {/* Cards grid */}
      {activeCenters.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-200 py-16 text-center dark:border-zinc-700">
          <FolderKanban className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
          <div>
            <p className="text-sm font-medium text-zinc-500">Sin proyectos registrados</p>
            <p className="text-xs text-zinc-400">Crea tu primer centro de costos para empezar a monitorear el gasto.</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-1 flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
            >
              <Plus className="h-4 w-4" />
              Nuevo proyecto
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeCenters.map((center) => (
            <CostCenterCard
              key={center.id}
              center={center}
              entries={entriesByCostCenter.get(center.id) ?? []}
              categoryKindMap={categoryKindMap}
              categoryLabelMap={categoryLabelMap}
              clientName={center.clientId ? (clientMap.get(center.clientId) ?? null) : null}
              isAdmin={isAdmin}
              onEdit={() => setEditing(center)}
              onDelete={() => void handleDelete(center.id)}
              onAddTransaction={() => setTxnTarget(center)}
              onDeleteTransaction={handleTransactionDeleted}
            />
          ))}
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-200 py-12 text-zinc-400 transition-colors hover:border-zinc-400 hover:text-zinc-600 dark:border-zinc-700 dark:hover:border-zinc-500 dark:hover:text-zinc-300"
            >
              <Plus className="h-6 w-6" />
              <span className="text-sm font-medium">Nuevo proyecto</span>
            </button>
          )}
        </div>
      )}

      {/* Cost center create/edit modal */}
      {(showModal || editing) && (
        <CostCenterModal
          initial={editing}
          clients={clients}
          onSave={editing ? (data) => handleUpdate(editing.id, data) : handleCreate}
          onClose={() => { setShowModal(false); setEditing(null); }}
        />
      )}

      {/* Transaction modal */}
      {txnTarget && (
        <TransactionModal
          costCenter={txnTarget}
          categories={categories}
          onSave={handleTransactionAdded}
          onClose={() => setTxnTarget(null)}
        />
      )}

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-5 py-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Eliminando…</p>
          </div>
        </div>
      )}
    </div>
  );
}
