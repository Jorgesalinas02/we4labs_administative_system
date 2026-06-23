"use client";

import { useMemo, useState, useCallback } from "react";
import type { BusinessCategoryRecord, CashFlowEntry, CategoryEntrySums, ClientRecord, TeamMemberRecord, GroupBudgets } from "@/lib/data";
import { CopAmountInput } from "@/components/cop-amount-input";
import { cn } from "@/lib/cn";
import { Plus, X, Trash2, ChevronLeft, ChevronRight, UserCircle, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { DatePickerInput } from "@/components/date-picker-input";
import { useRole } from "@/components/role-provider";

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
  clients?: ClientRecord[];
  teamMembers?: TeamMemberRecord[];
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
  teamMembers = [],
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
  const [occurredOn, setOccurredOn] = useState("");
  const [clientId, setClientId] = useState("");
  const [teamMemberId, setTeamMemberId] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const isExpense = kind === "expense";

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
        clientId: isExpense ? null : clientId || null,
        teamMemberId: isExpense ? teamMemberId || null : null,
      });
      setAmount(0);
      setDescription("");
      setOccurredOn("");
      setClientId("");
      setTeamMemberId("");
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
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Registrar transacción</p>
            <h3 className="mt-0.5 text-base font-semibold text-zinc-900 dark:text-zinc-100">{parentLabel}</h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
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

          <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/40 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Nueva transacción</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Fecha (opcional)</label>
                <DatePickerInput
                  value={occurredOn}
                  onChange={(iso) => {
                    setOccurredOn(iso);
                    if (iso) {
                      const ym = iso.slice(0, 7);
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
            {isExpense ? (
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  <UserCircle className="h-3.5 w-3.5" />
                  Miembro del equipo (opcional)
                </label>
                {teamMembers.length === 0 ? (
                  <p className="text-xs text-zinc-400">
                    No hay miembros del equipo registrados.{" "}
                    <a href="/equipo" className="underline hover:text-zinc-600">
                      Añadir en Equipo →
                    </a>
                  </p>
                ) : (
                  <select
                    value={teamMemberId}
                    onChange={(e) => setTeamMemberId(e.target.value)}
                    className={cn(inputCls, "w-full")}
                  >
                    <option value="">— Sin asignar —</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  <UserCircle className="h-3.5 w-3.5" />
                  Cliente (opcional)
                </label>
                {clients.length === 0 ? (
                  <p className="text-xs text-zinc-400">
                    No hay clientes registrados.{" "}
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
                    <option value="">— Sin cliente asociado —</option>
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
                  const memberName = e.teamMemberId ? teamMembers.find((m) => m.id === e.teamMemberId)?.name : null;
                  const personName = memberName ?? clientName;
                  return (
                    <div key={e.id} className="flex items-start justify-between gap-2 px-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium tabular-nums text-zinc-800 dark:text-zinc-200">
                          {fmtBold(e.amount)}
                        </p>
                        {personName && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                            <UserCircle className="h-3 w-3 shrink-0" />
                            {personName}
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

// ─── Transaction detail table ────────────────────────────────────────────────

type TransactionDetailTableProps = {
  entries: CashFlowEntry[];
  incomeCategories: BusinessCategoryRecord[];
  expenseCategories: BusinessCategoryRecord[];
  clients: ClientRecord[];
  teamMembers: TeamMemberRecord[];
  months: string[];
  monthLabels: string[];
  onDelete: (id: string) => Promise<void>;
};

function TransactionDetailTable({
  entries,
  incomeCategories,
  expenseCategories,
  clients,
  teamMembers,
  months,
  monthLabels,
  onDelete,
}: TransactionDetailTableProps) {
  const [filterDate, setFilterDate] = useState("");
  const [filterYm, setFilterYm] = useState("");
  const [filterKind, setFilterKind] = useState<"" | "income" | "expense">("");
  const [filterGroup, setFilterGroup] = useState("");
  const [filterPerson, setFilterPerson] = useState("");
  const [filterDesc, setFilterDesc] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const categoryMap = useMemo(() => {
    const m = new Map<string, { parentCode: string; parentLabel: string; label: string; kind: "income" | "expense" }>();
    for (const c of incomeCategories) m.set(c.code, { parentCode: c.parentCode, parentLabel: c.parentLabel, label: c.label, kind: "income" });
    for (const c of expenseCategories) m.set(c.code, { parentCode: c.parentCode, parentLabel: c.parentLabel, label: c.label, kind: "expense" });
    return m;
  }, [incomeCategories, expenseCategories]);

  // Unique groups present in entries
  const availableGroups = useMemo(() => {
    const seen = new Map<string, string>();
    for (const e of entries) {
      const cat = categoryMap.get(e.categoryCode);
      if (cat && !seen.has(cat.parentCode)) seen.set(cat.parentCode, cat.parentLabel);
    }
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [entries, categoryMap]);

  // Unique people (clients + team members) present in entries
  const availablePeople = useMemo(() => {
    const seen = new Map<string, string>();
    for (const e of entries) {
      if (e.clientId) {
        const name = clients.find((c) => c.id === e.clientId)?.name;
        if (name) seen.set(e.clientId, name);
      }
      if (e.teamMemberId) {
        const name = teamMembers.find((m) => m.id === e.teamMemberId)?.name;
        if (name) seen.set(e.teamMemberId, name);
      }
    }
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [entries, clients, teamMembers]);

  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c.name])), [clients]);
  const memberMap = useMemo(() => new Map(teamMembers.map((m) => [m.id, m.name])), [teamMembers]);

  const hasFilters = filterDate || filterYm || filterKind || filterGroup || filterPerson || filterDesc;

  const filtered = useMemo(() => {
    const descLower = filterDesc.toLowerCase();
    return entries
      .filter((e) => !filterDate || e.occurredOn === filterDate)
      .filter((e) => !filterYm || e.periodYm === filterYm)
      .filter((e) => !filterKind || categoryMap.get(e.categoryCode)?.kind === filterKind)
      .filter((e) => !filterGroup || categoryMap.get(e.categoryCode)?.parentCode === filterGroup)
      .filter((e) => {
        if (!filterPerson) return true;
        return e.clientId === filterPerson || e.teamMemberId === filterPerson;
      })
      .filter((e) => {
        if (!descLower) return true;
        return (e.description ?? "").toLowerCase().includes(descLower);
      })
      .slice()
      .sort((a, b) => {
        if (b.periodYm !== a.periodYm) return b.periodYm.localeCompare(a.periodYm);
        return (b.occurredOn ?? "").localeCompare(a.occurredOn ?? "");
      });
  }, [entries, filterDate, filterYm, filterKind, filterGroup, filterPerson, filterDesc, categoryMap]);

  const total = filtered.reduce((s, e) => {
    const kind = categoryMap.get(e.categoryCode)?.kind;
    return kind === "income" ? s + e.amount : s - e.amount;
  }, 0);

  function clearFilters() {
    setFilterDate(""); setFilterYm(""); setFilterKind(""); setFilterGroup("");
    setFilterPerson(""); setFilterDesc("");
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try { await onDelete(id); }
    finally { setDeletingId(null); }
  }

  const filterInputCls = "w-full rounded border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600 placeholder-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:placeholder-zinc-600";

  if (entries.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Detalle de transacciones
        </h2>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-zinc-400 underline underline-offset-2 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {filtered.length === 0 && hasFilters ? (
        <p className="py-6 text-center text-sm text-zinc-400">Sin transacciones para los filtros seleccionados.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              {/* Column labels */}
              <tr className="bg-zinc-50 dark:bg-zinc-900">
                <th className="border-b border-zinc-100 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:border-zinc-800 dark:text-zinc-400 w-24">Fecha</th>
                <th className="border-b border-zinc-100 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:border-zinc-800 dark:text-zinc-400 w-28">Mes</th>
                <th className="border-b border-zinc-100 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">Grupo / Subcategoría</th>
                <th className="border-b border-zinc-100 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">Descripción</th>
                <th className="border-b border-zinc-100 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">Persona</th>
                <th className="border-b border-zinc-100 px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:border-zinc-800 dark:text-zinc-400 w-36">Monto</th>
                <th className="border-b border-zinc-100 px-3 py-2.5 dark:border-zinc-800 w-10" />
              </tr>
              {/* Filter row */}
              <tr className="bg-zinc-50/80 dark:bg-zinc-900/60">
                <td className="border-b border-zinc-200 px-2 py-1.5 dark:border-zinc-800">
                  <DatePickerInput
                    value={filterDate}
                    onChange={setFilterDate}
                    placeholder="Filtrar fecha…"
                    className={filterInputCls}
                  />
                </td>
                <td className="border-b border-zinc-200 px-2 py-1.5 dark:border-zinc-800">
                  <select value={filterYm} onChange={(e) => setFilterYm(e.target.value)} className={filterInputCls}>
                    <option value="">Todos</option>
                    {months.map((ym, i) => <option key={ym} value={ym}>{monthLabels[i]}</option>)}
                  </select>
                </td>
                <td className="border-b border-zinc-200 px-2 py-1.5 dark:border-zinc-800">
                  <select value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)} className={filterInputCls}>
                    <option value="">Todos los grupos</option>
                    {availableGroups.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                  </select>
                </td>
                <td className="border-b border-zinc-200 px-2 py-1.5 dark:border-zinc-800">
                  <input
                    type="text"
                    placeholder="Buscar…"
                    value={filterDesc}
                    onChange={(e) => setFilterDesc(e.target.value)}
                    className={filterInputCls}
                  />
                </td>
                <td className="border-b border-zinc-200 px-2 py-1.5 dark:border-zinc-800">
                  <select value={filterPerson} onChange={(e) => setFilterPerson(e.target.value)} className={filterInputCls}>
                    <option value="">Todas</option>
                    {availablePeople.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                  </select>
                </td>
                <td className="border-b border-zinc-200 px-2 py-1.5 dark:border-zinc-800">
                  <select value={filterKind} onChange={(e) => setFilterKind(e.target.value as "" | "income" | "expense")} className={cn(filterInputCls, "text-right")}>
                    <option value="">Todos</option>
                    <option value="income">Ingresos</option>
                    <option value="expense">Egresos</option>
                  </select>
                </td>
                <td className="border-b border-zinc-200 px-2 py-1.5 dark:border-zinc-800" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => {
                const cat = categoryMap.get(e.categoryCode);
                const isIncome = cat?.kind === "income";
                const personName = e.teamMemberId
                  ? memberMap.get(e.teamMemberId) ?? null
                  : e.clientId ? clientMap.get(e.clientId) ?? null : null;
                return (
                  <tr
                    key={e.id}
                    className={cn(
                      "group border-b border-zinc-100 last:border-0 hover:bg-zinc-50/60 dark:border-zinc-800 dark:hover:bg-zinc-800/20",
                      i % 2 === 0 ? "" : "bg-zinc-50/30 dark:bg-zinc-900/20",
                    )}
                  >
                    <td className="px-3 py-2.5 text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                      {e.occurredOn ? fmtDate(e.occurredOn) : <span className="text-zinc-300 dark:text-zinc-600">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      {monthLabels[months.indexOf(e.periodYm)] ?? e.periodYm}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {isIncome
                          ? <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          : <ArrowDownLeft className="h-3.5 w-3.5 shrink-0 text-red-400" />}
                        <div>
                          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{cat?.parentLabel ?? e.categoryCode}</p>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500">{cat?.label ?? ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[220px] px-3 py-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                      {e.description ?? <span className="text-zinc-300 dark:text-zinc-600">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      {personName ? (
                        <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                          <UserCircle className="h-3 w-3 shrink-0" />
                          {personName}
                        </span>
                      ) : <span className="text-zinc-300 dark:text-zinc-600">—</span>}
                    </td>
                    <td className={cn(
                      "px-3 py-2.5 text-right text-sm font-semibold tabular-nums",
                      isIncome ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
                    )}>
                      {isIncome ? "+" : "−"}{fmtBold(e.amount)}
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => void handleDelete(e.id)}
                        disabled={deletingId === e.id}
                        className="rounded p-1 text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 disabled:opacity-30 dark:text-zinc-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50">
                <td colSpan={5} className="px-3 py-2.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  {filtered.length} transacción{filtered.length !== 1 ? "es" : ""}{hasFilters ? " (filtradas)" : ""}
                </td>
                <td className={cn(
                  "px-3 py-2.5 text-right text-sm font-bold tabular-nums",
                  total >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
                )}>
                  {total >= 0 ? "+" : "−"}{fmtBold(Math.abs(total))}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Table sub-components ────────────────────────────────────────────────────

function SectionHeader({ label, months }: { label: string; months: string[] }) {
  return (
    <tr>
      <td
        colSpan={months.length * 2 + 3}
        className="sticky left-0 z-10 bg-zinc-100 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
      >
        {label}
      </td>
    </tr>
  );
}

type EditingCell = { parentCode: string; ym: string } | null;

type GroupRowProps = {
  parentCode: string;
  label: string;
  months: string[];
  sums: CategoryEntrySums;
  budgets: GroupBudgets;
  codes: string[];
  onAdd: () => void;
  isAdmin: boolean;
  editingCell: EditingCell;
  editValue: string;
  onStartEdit: (parentCode: string, ym: string, current: number) => void;
  onEditChange: (v: string) => void;
  onEditCommit: () => void;
  onEditCancel: () => void;
};

function GroupRow({
  parentCode,
  label,
  months,
  sums,
  budgets,
  codes,
  onAdd,
  isAdmin,
  editingCell,
  editValue,
  onStartEdit,
  onEditChange,
  onEditCommit,
  onEditCancel,
}: GroupRowProps) {
  const realAnnual = months.reduce((s, ym) => s + codes.reduce((ss, c) => ss + (sums[c]?.[ym] ?? 0), 0), 0);
  const budgetAnnual = months.reduce((s, ym) => s + (budgets[parentCode]?.[ym] ?? 0), 0);

  return (
    <tr className="border-b border-zinc-100 hover:bg-zinc-50/60 dark:border-zinc-800 dark:hover:bg-zinc-800/20">
      <td className="sticky left-0 z-10 min-w-[200px] max-w-[240px] border-r border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
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
      {months.flatMap((ym) => {
        const realV = codes.reduce((s, c) => s + (sums[c]?.[ym] ?? 0), 0);
        const budgetV = budgets[parentCode]?.[ym] ?? 0;
        const isEditing = editingCell?.parentCode === parentCode && editingCell?.ym === ym;

        return [
          <td
            key={`${ym}-p`}
            className="border-r border-zinc-100 bg-zinc-50/60 px-2 py-2 text-right dark:border-zinc-800 dark:bg-zinc-900/20"
          >
            {isAdmin ? (
              isEditing ? (
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={editValue}
                  onChange={(e) => onEditChange(e.target.value)}
                  onBlur={onEditCommit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onEditCommit();
                    if (e.key === "Escape") onEditCancel();
                  }}
                  className="w-full min-w-[72px] bg-transparent text-right text-sm tabular-nums outline-none border-b border-blue-400 text-zinc-700 dark:text-zinc-300"
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                />
              ) : (
                <button
                  type="button"
                  onClick={() => onStartEdit(parentCode, ym, budgetV)}
                  title="Clic para editar presupuesto"
                  className="w-full text-right text-sm tabular-nums text-zinc-400 hover:text-blue-600 dark:text-zinc-500 dark:hover:text-blue-400"
                >
                  {fmt(budgetV)}
                </button>
              )
            ) : (
              <span className="block text-right text-sm tabular-nums text-zinc-400 dark:text-zinc-500">
                {fmt(budgetV)}
              </span>
            )}
          </td>,
          <td
            key={`${ym}-r`}
            className="border-r border-zinc-100 px-2 py-2 text-right text-sm tabular-nums text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
          >
            {fmt(realV)}
          </td>,
        ];
      })}
      {/* Totals */}
      <td className="border-l border-zinc-200 bg-zinc-50/60 px-2.5 py-2 text-right text-sm tabular-nums text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/20 dark:text-zinc-500">
        {budgetAnnual === 0 ? "—" : fmtBold(budgetAnnual)}
      </td>
      <td className="px-2.5 py-2 text-right text-sm font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">
        {realAnnual === 0 ? "—" : fmtBold(realAnnual)}
      </td>
    </tr>
  );
}

type DualTotalRowProps = {
  label: string;
  months: string[];
  realTotals: Record<string, number>;
  budgetTotals: Record<string, number>;
  realAnnual: number;
  budgetAnnual: number;
  positive?: boolean;
};

function DualTotalRow({ label, months, realTotals, budgetTotals, realAnnual, budgetAnnual, positive }: DualTotalRowProps) {
  return (
    <tr className="border-y border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50">
      <td className="sticky left-0 z-10 min-w-[200px] max-w-[240px] border-r border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
        {label}
      </td>
      {months.flatMap((ym) => [
        <td
          key={`${ym}-p`}
          className="border-r border-zinc-200 bg-zinc-100/60 px-2 py-2 text-right text-sm font-semibold tabular-nums text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-500"
        >
          {fmtBold(budgetTotals[ym] ?? 0)}
        </td>,
        <td
          key={`${ym}-r`}
          className={cn(
            "border-r border-zinc-200 px-2 py-2 text-right text-sm font-semibold tabular-nums dark:border-zinc-800",
            positive ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
          )}
        >
          {fmtBold(realTotals[ym] ?? 0)}
        </td>,
      ])}
      <td className="border-l border-zinc-200 bg-zinc-100/60 px-2.5 py-2 text-right text-sm font-bold tabular-nums text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-500">
        {fmtBold(budgetAnnual)}
      </td>
      <td className="px-2.5 py-2 text-right text-sm font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
        {fmtBold(realAnnual)}
      </td>
    </tr>
  );
}

type DualComputedRowProps = {
  label: string;
  months: string[];
  realValues: Record<string, number>;
  budgetValues: Record<string, number>;
  highlight?: boolean;
};

function DualComputedRow({ label, months, realValues, budgetValues, highlight }: DualComputedRowProps) {
  return (
    <tr className={cn("border-b border-zinc-200 dark:border-zinc-800", highlight && "bg-zinc-50 dark:bg-zinc-900/40")}>
      <td className={cn(
        "sticky left-0 z-10 min-w-[200px] max-w-[240px] border-r border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800",
        highlight
          ? "font-bold bg-zinc-50 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
          : "bg-white text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300",
      )}>
        {label}
      </td>
      {months.flatMap((ym) => {
        const bv = budgetValues[ym] ?? 0;
        const rv = realValues[ym] ?? 0;
        return [
          <td
            key={`${ym}-p`}
            className={cn(
              "border-r border-zinc-100 bg-zinc-50/60 px-2 py-2 text-right text-sm tabular-nums dark:border-zinc-800 dark:bg-zinc-900/20",
              highlight
                ? (bv < 0 ? "font-bold text-red-500 dark:text-red-400" : "font-bold text-zinc-500 dark:text-zinc-400")
                : "text-zinc-400 dark:text-zinc-500",
            )}
          >
            {fmtBold(bv)}
          </td>,
          <td
            key={`${ym}-r`}
            className={cn(
              "border-r border-zinc-100 px-2 py-2 text-right text-sm tabular-nums dark:border-zinc-800",
              highlight
                ? (rv < 0 ? "font-bold text-red-600 dark:text-red-400" : "font-bold text-zinc-900 dark:text-zinc-100")
                : "text-zinc-600 dark:text-zinc-400",
            )}
          >
            {fmtBold(rv)}
          </td>,
        ];
      })}
      <td className={cn(
        "border-l border-zinc-200 bg-zinc-50/60 px-2.5 py-2 text-right text-sm tabular-nums dark:border-zinc-800 dark:bg-zinc-900/20",
        highlight ? "font-bold text-zinc-500 dark:text-zinc-400" : "text-zinc-400 dark:text-zinc-500",
      )}>
        {fmtBold(months.reduce((s, ym) => s + (budgetValues[ym] ?? 0), 0))}
      </td>
      <td className={cn(
        "px-2.5 py-2 text-right text-sm tabular-nums",
        highlight ? "font-bold text-zinc-900 dark:text-zinc-100" : "font-semibold text-zinc-700 dark:text-zinc-300",
      )}>
        {fmtBold(months.reduce((s, ym) => s + (realValues[ym] ?? 0), 0))}
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
  teamMembers?: TeamMemberRecord[];
  initialBudgets: GroupBudgets;
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
  teamMembers = [],
  initialBudgets,
}: Props) {
  const { isAdmin } = useRole();
  const [sums, setSums] = useState<CategoryEntrySums>(initialSums);
  const [entries, setEntries] = useState<CashFlowEntry[]>(initialEntries);
  const [budgets, setBudgets] = useState<GroupBudgets>(initialBudgets);
  const [openModal, setOpenModal] = useState<OpenModal | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Budget inline editing
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [editValue, setEditValue] = useState("");

  function startEdit(parentCode: string, ym: string, current: number) {
    setEditingCell({ parentCode, ym });
    setEditValue(current === 0 ? "" : String(current));
  }

  function cancelEdit() {
    setEditingCell(null);
    setEditValue("");
  }

  function commitEdit() {
    if (!editingCell) return;
    const { parentCode, ym } = editingCell;
    const amount = Math.max(0, Number(editValue.replace(",", ".")) || 0);
    // Optimistic update
    setBudgets((prev) => ({
      ...prev,
      [parentCode]: { ...(prev[parentCode] ?? {}), [ym]: amount },
    }));
    setEditingCell(null);
    setEditValue("");
    // Persist
    void fetch("/api/cash-flow-category-cells", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cells: [{ lineCode: parentCode, periodYm: ym, amount }] }),
    });
  }

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

  // Real totals
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

  // Budget totals
  const incomeBudgetTotals = useMemo(
    () => Object.fromEntries(months.map((ym) => [ym, incomeGroups.reduce((s, [pc]) => s + (budgets[pc]?.[ym] ?? 0), 0)])),
    [budgets, incomeGroups, months],
  );
  const expenseBudgetTotals = useMemo(
    () => Object.fromEntries(months.map((ym) => [ym, expenseGroups.reduce((s, [pc]) => s + (budgets[pc]?.[ym] ?? 0), 0)])),
    [budgets, expenseGroups, months],
  );
  const flujoNetoBudget = useMemo(
    () => Object.fromEntries(months.map((ym) => [ym, (incomeBudgetTotals[ym] ?? 0) - (expenseBudgetTotals[ym] ?? 0)])),
    [incomeBudgetTotals, expenseBudgetTotals, months],
  );
  const saldoFinalBudget = useMemo(() => {
    const result: Record<string, number> = {};
    let running = saldoInicial;
    for (const ym of months) {
      running += flujoNetoBudget[ym] ?? 0;
      result[ym] = running;
    }
    return result;
  }, [flujoNetoBudget, months, saldoInicial]);

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

  const THmonth = "border-r border-zinc-200 px-2 py-2 text-center text-xs font-medium whitespace-nowrap text-zinc-500 dark:border-zinc-800 dark:text-zinc-400";
  const THsub = "border-r border-zinc-100 px-2 py-1 text-right text-xs tabular-nums dark:border-zinc-800";

  const groupRowProps = {
    months,
    sums,
    budgets,
    isAdmin,
    editingCell,
    editValue,
    onStartEdit: startEdit,
    onEditChange: setEditValue,
    onEditCommit: commitEdit,
    onEditCancel: cancelEdit,
  };

  return (
    <div className="space-y-3">
      {isAdmin && (
        <p className="text-xs text-zinc-400 dark:text-zinc-600">
          Columna <span className="font-medium text-zinc-500">Presup.</span> — clic en cualquier celda para editar el presupuesto mensual.
        </p>
      )}
      {err && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">{err}</p>
      )}

      <div className="w-full overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <table className="border-separate border-spacing-0 text-sm" style={{ minWidth: `${months.length * 160 + 360}px` }}>
          <thead>
            {/* Row 1: month labels (each spans 2 columns) */}
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
              <th
                rowSpan={2}
                className="sticky left-0 z-20 min-w-[200px] max-w-[240px] border-b border-r border-zinc-200 bg-zinc-50 px-3 py-2.5 text-left font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              >
                Concepto
              </th>
              {months.map((ym, i) => (
                <th key={ym} colSpan={2} className={THmonth}>
                  {monthLabels[i]}
                </th>
              ))}
              <th colSpan={2} className="min-w-[160px] border-l border-zinc-200 px-2.5 py-2 text-center text-xs font-semibold whitespace-nowrap text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
                Total anual
              </th>
            </tr>
            {/* Row 2: Presup. / Real sub-headers */}
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
              {months.flatMap((ym) => [
                <th key={`${ym}-p`} className={cn(THsub, "bg-zinc-100/60 text-zinc-400 dark:bg-zinc-900/30 dark:text-zinc-500")}>
                  Presup.
                </th>,
                <th key={`${ym}-r`} className={cn(THsub, "text-zinc-500 dark:text-zinc-400")}>
                  Real
                </th>,
              ])}
              <th className="border-l border-r border-zinc-100 bg-zinc-100/60 px-2 py-1 text-right text-xs text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-500">
                Presup.
              </th>
              <th className="px-2 py-1 text-right text-xs text-zinc-500 dark:text-zinc-400">
                Real
              </th>
            </tr>
          </thead>
          <tbody>
            {/* INGRESOS */}
            <SectionHeader label="INGRESOS" months={months} />
            {incomeGroups.map(([parentCode, group]) => (
              <GroupRow
                key={parentCode}
                parentCode={parentCode}
                label={group.label}
                codes={group.codes.map((c) => c.code)}
                onAdd={() => setOpenModal({ parentCode, parentLabel: group.label, kind: "income" })}
                {...groupRowProps}
              />
            ))}
            {incomeCategories.length === 0 && (
              <tr>
                <td colSpan={months.length * 2 + 3} className="px-4 py-3 text-sm text-zinc-400 italic">
                  Sin categorías de ingreso. Configúralas en Supuestos.
                </td>
              </tr>
            )}
            <DualTotalRow
              label="TOTAL INGRESOS"
              months={months}
              realTotals={incomeTotals}
              budgetTotals={incomeBudgetTotals}
              realAnnual={Object.values(incomeTotals).reduce((a, b) => a + b, 0)}
              budgetAnnual={Object.values(incomeBudgetTotals).reduce((a, b) => a + b, 0)}
              positive
            />

            {/* EGRESOS */}
            <SectionHeader label="EGRESOS" months={months} />
            {expenseGroups.map(([parentCode, group]) => (
              <GroupRow
                key={parentCode}
                parentCode={parentCode}
                label={group.label}
                codes={group.codes.map((c) => c.code)}
                onAdd={() => setOpenModal({ parentCode, parentLabel: group.label, kind: "expense" })}
                {...groupRowProps}
              />
            ))}
            {expenseCategories.length === 0 && (
              <tr>
                <td colSpan={months.length * 2 + 3} className="px-4 py-3 text-sm text-zinc-400 italic">
                  Sin categorías de egreso. Configúralas en Supuestos.
                </td>
              </tr>
            )}
            <DualTotalRow
              label="TOTAL EGRESOS"
              months={months}
              realTotals={expenseTotals}
              budgetTotals={expenseBudgetTotals}
              realAnnual={Object.values(expenseTotals).reduce((a, b) => a + b, 0)}
              budgetAnnual={Object.values(expenseBudgetTotals).reduce((a, b) => a + b, 0)}
            />

            {/* FLUJO NETO */}
            <DualComputedRow
              label="Flujo neto del período"
              months={months}
              realValues={flujoNeto}
              budgetValues={flujoNetoBudget}
              highlight
            />

            {/* Saldo inicial */}
            <tr className="border-b border-zinc-100 dark:border-zinc-800">
              <td className="sticky left-0 z-10 min-w-[200px] max-w-[240px] border-r border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  Saldo inicial de caja
                  <a href="/supuestos#saldo" className="text-xs text-zinc-400 underline underline-offset-2 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400">
                    ✎ editar
                  </a>
                </span>
              </td>
              {months.flatMap((ym, i) => [
                <td key={`${ym}-p`} className="border-r border-zinc-100 bg-zinc-50/60 px-2 py-2 text-right text-sm tabular-nums text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/20 dark:text-zinc-500">
                  {i === 0 ? fmtBold(saldoInicial) : "—"}
                </td>,
                <td key={`${ym}-r`} className="border-r border-zinc-100 px-2 py-2 text-right text-sm tabular-nums text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
                  {i === 0 ? fmtBold(saldoInicial) : "—"}
                </td>,
              ])}
              <td className="border-l border-zinc-200 bg-zinc-50/60 px-2.5 py-2 text-right text-sm tabular-nums text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/20 dark:text-zinc-500">
                {fmtBold(saldoInicial)}
              </td>
              <td className="px-2.5 py-2 text-right text-sm tabular-nums text-zinc-500 dark:text-zinc-500">
                {fmtBold(saldoInicial)}
              </td>
            </tr>

            {/* Saldo final */}
            <DualComputedRow
              label="Saldo final de caja"
              months={months}
              realValues={saldoFinal}
              budgetValues={saldoFinalBudget}
            />
          </tbody>
        </table>
      </div>

      <TransactionDetailTable
        entries={entries}
        incomeCategories={incomeCategories}
        expenseCategories={expenseCategories}
        clients={clients}
        teamMembers={teamMembers}
        months={months}
        monthLabels={monthLabels}
        onDelete={handleDelete}
      />

      {openModal && (
        <EntryModal
          parentLabel={openModal.parentLabel}
          subcategories={modalSubcats}
          months={months}
          monthLabels={monthLabels}
          entries={entries}
          clients={clients}
          teamMembers={teamMembers}
          kind={openModal.kind}
          onAdd={handleAdd}
          onDelete={handleDelete}
          onClose={() => setOpenModal(null)}
        />
      )}
    </div>
  );
}
