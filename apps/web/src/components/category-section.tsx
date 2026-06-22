"use client";

import { useState, useTransition, useMemo } from "react";
import {
  INCOME_CATALOG,
  EXPENSE_CATALOG,
  groupByParent,
} from "@we4labs/shared";
import type { BusinessCategoryRecord } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, X, PenLine } from "lucide-react";

// ─── Badge ───────────────────────────────────────────────────────────────────

function ClientBadge({ flag }: { flag: string }) {
  if (flag === "required") {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
        Pide cliente
      </span>
    );
  }
  if (flag === "optional") {
    return (
      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
        Opcional
      </span>
    );
  }
  return null;
}

// ─── Modal base ───────────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 mx-4 w-full max-w-lg rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-700">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Add-from-catalog modal ───────────────────────────────────────────────────

type AddCatalogModalProps = {
  kind: "income" | "expense";
  existingCodes: Set<string>;
  onAdd: (codes: string[]) => void;
  loading: boolean;
};

function AddCatalogModal({ kind, existingCodes, onAdd, loading }: AddCatalogModalProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const catalog = kind === "income" ? INCOME_CATALOG : EXPENSE_CATALOG;
  const grouped = useMemo(() => groupByParent(catalog), [catalog]);

  const toggle = (code: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) { next.delete(code); } else { next.add(code); }
      return next;
    });

  const handleAdd = () => {
    onAdd([...selected]);
    setSelected(new Set());
    setOpen(false);
  };

  const availableCount = catalog.filter((c) => !existingCodes.has(c.code)).length;

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Agregar del catálogo
        {availableCount > 0 && (
          <span className="ml-1 rounded-full bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {availableCount}
          </span>
        )}
      </Button>

      {open && (
        <Modal
          title={kind === "income" ? "Agregar categorías de ingreso" : "Agregar categorías de egreso"}
          onClose={() => setOpen(false)}
        >
          <div className="max-h-[420px] overflow-y-auto px-5 py-4">
            {[...grouped.entries()].map(([parentCode, items]) => {
              const available = items.filter((c) => !existingCodes.has(c.code));
              if (available.length === 0) return null;
              return (
                <div key={parentCode} className="mb-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    {items[0]?.parentLabel}
                  </p>
                  <div className="space-y-1">
                    {available.map((item) => (
                      <label
                        key={item.code}
                        className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(item.code)}
                          onChange={() => toggle(item.code)}
                          className="h-4 w-4 rounded border-zinc-300 accent-blue-600"
                        />
                        <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300">
                          {item.label}
                        </span>
                        <ClientBadge flag={item.asksClient} />
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end gap-2 border-t border-zinc-200 px-5 py-3 dark:border-zinc-700">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleAdd} disabled={selected.size === 0 || loading}>
              {loading ? "Guardando…" : `Agregar${selected.size > 0 ? ` (${selected.size})` : ""}`}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ─── Create-custom modal ──────────────────────────────────────────────────────

type CreateCustomModalProps = {
  kind: "income" | "expense";
  existingParents: string[];
  onCreate: (custom: {
    label: string;
    parentLabel: string;
    asksClient: string;
  }) => void;
  loading: boolean;
};

function CreateCustomModal({ kind, existingParents, onCreate, loading }: CreateCustomModalProps) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [parentLabel, setParentLabel] = useState("");
  const [asksClient, setAsksClient] = useState("none");

  const reset = () => {
    setLabel("");
    setParentLabel("");
    setAsksClient("none");
  };

  const handleCreate = () => {
    if (!label.trim() || !parentLabel.trim()) return;
    onCreate({ label: label.trim(), parentLabel: parentLabel.trim(), asksClient });
    reset();
    setOpen(false);
  };

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <PenLine className="h-4 w-4" />
        Crear nueva
      </Button>

      {open && (
        <Modal
          title={kind === "income" ? "Nueva categoría de ingreso" : "Nueva categoría de egreso"}
          onClose={() => { setOpen(false); reset(); }}
        >
          <div className="space-y-4 px-5 py-4">
            {/* nombre */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Nombre de la categoría <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="ej. Venta de cursos online"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>

            {/* grupo madre */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Grupo / categoría madre <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="ej. Ventas operacionales"
                list={`parents-${kind}`}
                value={parentLabel}
                onChange={(e) => setParentLabel(e.target.value)}
              />
              <datalist id={`parents-${kind}`}>
                {existingParents.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
              <p className="text-xs text-zinc-400">
                Escribe uno nuevo o elige un grupo ya existente de la lista.
              </p>
            </div>

            {/* pide cliente */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                ¿Requiere asociar un cliente?
              </label>
              <div className="flex gap-3">
                {[
                  { value: "none", label: "No" },
                  { value: "optional", label: "Opcional" },
                  { value: "required", label: "Sí, siempre" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                      asksClient === opt.value
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
                        : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`asksClient-${kind}`}
                      value={opt.value}
                      checked={asksClient === opt.value}
                      onChange={() => setAsksClient(opt.value)}
                      className="sr-only"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-zinc-200 px-5 py-3 dark:border-zinc-700">
            <Button variant="outline" size="sm" onClick={() => { setOpen(false); reset(); }}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!label.trim() || !parentLabel.trim() || loading}
            >
              {loading ? "Guardando…" : "Crear categoría"}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ─── Main section component ───────────────────────────────────────────────────

type CategorySectionProps = {
  kind: "income" | "expense";
  categories: BusinessCategoryRecord[];
};

export function CategorySection({ kind, categories }: CategorySectionProps) {
  const [rows, setRows] = useState<BusinessCategoryRecord[]>(categories);
  const [isPending, startTransition] = useTransition();

  const existingCodes = useMemo(() => new Set(rows.map((r) => r.code)), [rows]);
  const existingParents = useMemo(
    () => [...new Set(rows.map((r) => r.parentLabel).filter(Boolean))],
    [rows],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, BusinessCategoryRecord[]>();
    for (const row of rows) {
      const group = map.get(row.parentCode) ?? [];
      group.push(row);
      map.set(row.parentCode, group);
    }
    return map;
  }, [rows]);

  const refreshRows = async () => {
    const updated = await fetch("/api/business-categories").then((r) => r.json());
    setRows((updated as BusinessCategoryRecord[]).filter((c) => c.kind === kind));
  };

  const handleAddFromCatalog = (codes: string[]) => {
    startTransition(async () => {
      const res = await fetch("/api/business-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codes }),
      });
      if (res.ok) await refreshRows();
    });
  };

  const handleCreateCustom = (custom: { label: string; parentLabel: string; asksClient: string }) => {
    startTransition(async () => {
      const res = await fetch("/api/business-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custom: { ...custom, kind } }),
      });
      if (res.ok) await refreshRows();
    });
  };

  const handleDelete = (code: string) => {
    startTransition(async () => {
      const res = await fetch("/api/business-categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (res.ok) setRows((prev) => prev.filter((r) => r.code !== code));
    });
  };

  return (
    <div className="space-y-4">
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-400 dark:border-zinc-700">
          Sin categorías aún. Agrega del catálogo o crea una nueva.
        </p>
      ) : (
        <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-700">
          {[...grouped.entries()].map(([parentCode, items]) => (
            <div key={parentCode} className="p-4">
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {items[0]?.parentLabel}
              </p>
              <div className="space-y-1">
                {items.map((row) => (
                  <div
                    key={row.code}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                  >
                    <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300">
                      {row.label}
                    </span>
                    <ClientBadge flag={row.asksClient ?? "none"} />
                    <button
                      onClick={() => handleDelete(row.code)}
                      disabled={isPending}
                      className="ml-1 rounded p-1 text-zinc-300 hover:bg-zinc-100 hover:text-red-500 disabled:opacity-40 dark:hover:bg-zinc-700"
                      title="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <CreateCustomModal
          kind={kind}
          existingParents={existingParents}
          onCreate={handleCreateCustom}
          loading={isPending}
        />
        <AddCatalogModal
          kind={kind}
          existingCodes={existingCodes}
          onAdd={handleAddFromCatalog}
          loading={isPending}
        />
      </div>
    </div>
  );
}
