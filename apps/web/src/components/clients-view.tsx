"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ClientRecord } from "@/lib/data";
import { cn } from "@/lib/cn";
import { Plus, Pencil, Trash2, X, Building2, User, Landmark, HelpCircle } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const CLIENT_TYPES = [
  { value: "empresa", label: "Empresa / Persona Jurídica", icon: Building2 },
  { value: "persona_natural", label: "Persona Natural", icon: User },
  { value: "gobierno", label: "Gobierno / Entidad Pública", icon: Landmark },
  { value: "otro", label: "Otro", icon: HelpCircle },
] as const;

type ClientTypeValue = (typeof CLIENT_TYPES)[number]["value"];

function typeLabel(v: string | null) {
  return CLIENT_TYPES.find((t) => t.value === v)?.label ?? v ?? "—";
}
function typeIcon(v: string | null) {
  const Icon = CLIENT_TYPES.find((t) => t.value === v)?.icon ?? HelpCircle;
  return <Icon className="h-3.5 w-3.5 shrink-0" />;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

type ClientForm = {
  name: string;
  nit: string;
  clientType: string;
  notes: string;
};

const EMPTY_FORM: ClientForm = { name: "", nit: "", clientType: "", notes: "" };

function ClientModal({
  initial,
  onSave,
  onClose,
}: {
  initial: ClientForm;
  onSave: (f: ClientForm) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ClientForm>(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function set(k: keyof ClientForm, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSave() {
    if (!form.name.trim()) { setErr("El nombre es requerido."); return; }
    setErr(null);
    setSaving(true);
    try { await onSave(form); }
    catch (e) { setErr(String(e)); }
    finally { setSaving(false); }
  }

  const inputCls =
    "h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {initial.name ? "Editar cliente" : "Nuevo cliente"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* Nombre */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Nombre del cliente <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              type="text"
              placeholder="Ej. Empresa ABC S.A.S."
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputCls}
            />
          </div>

          {/* NIT / RUT */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              NIT / RUT
            </label>
            <input
              type="text"
              placeholder="Ej. 900.123.456-7"
              value={form.nit}
              onChange={(e) => set("nit", e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Tipo de cliente */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Tipo de cliente
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CLIENT_TYPES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set("clientType", form.clientType === value ? "" : value)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors text-left",
                    form.clientType === value
                      ? "border-zinc-800 bg-zinc-900 text-white dark:border-zinc-200 dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800",
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Notas generales
            </label>
            <textarea
              rows={3}
              placeholder="Información adicional, condiciones especiales, contacto…"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              className="w-full resize-none rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>

          {err && <p className="text-sm text-red-600 dark:text-red-400">{err}</p>}

          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {saving ? "Guardando…" : initial.name ? "Guardar cambios" : "Crear cliente"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({
  name,
  onConfirm,
  onCancel,
}: {
  name: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function confirm() {
    setDeleting(true);
    try { await onConfirm(); }
    finally { setDeleting(false); }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Eliminar cliente</h3>
        <p className="mt-2 text-sm text-zinc-500">
          ¿Seguro que deseas eliminar a <span className="font-medium text-zinc-800 dark:text-zinc-200">"{name}"</span>? Esta acción no se puede deshacer.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            onClick={() => void confirm()}
            disabled={deleting}
            className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40"
          >
            {deleting ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

type Modal =
  | { kind: "create" }
  | { kind: "edit"; client: ClientRecord }
  | { kind: "delete"; client: ClientRecord };

export function ClientsView({ initialClients }: { initialClients: ClientRecord[] }) {
  const router = useRouter();
  const [clientsList, setClientsList] = useState<ClientRecord[]>(initialClients);
  const [modal, setModal] = useState<Modal | null>(null);
  const [search, setSearch] = useState("");

  const filtered = clientsList.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.nit ?? "").includes(search),
  );

  async function handleCreate(form: ClientForm) {
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        nit: form.nit || null,
        clientType: form.clientType || null,
        notes: form.notes || null,
      }),
    });
    const data = await res.json() as ClientRecord & { error?: string };
    if (!res.ok) throw new Error(data.error ?? "Error al crear");
    setClientsList((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    setModal(null);
    router.refresh();
  }

  async function handleEdit(form: ClientForm) {
    if (modal?.kind !== "edit") return;
    const res = await fetch("/api/clients", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: modal.client.id,
        name: form.name,
        nit: form.nit || null,
        clientType: form.clientType || null,
        notes: form.notes || null,
      }),
    });
    const data = await res.json() as { error?: string };
    if (!res.ok) throw new Error(data.error ?? "Error al guardar");
    setClientsList((prev) =>
      prev.map((c) =>
        c.id === modal.client.id
          ? { ...c, name: form.name, nit: form.nit || null, clientType: form.clientType || null, notes: form.notes || null }
          : c,
      ).sort((a, b) => a.name.localeCompare(b.name)),
    );
    setModal(null);
    router.refresh();
  }

  async function handleDelete() {
    if (modal?.kind !== "delete") return;
    const res = await fetch(`/api/clients?id=${modal.client.id}`, { method: "DELETE" });
    const data = await res.json() as { error?: string };
    if (!res.ok) throw new Error(data.error ?? "Error al eliminar");
    setClientsList((prev) => prev.filter((c) => c.id !== modal.client.id));
    setModal(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre o NIT…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 flex-1 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 max-w-xs"
        />
        <button
          onClick={() => setModal({ kind: "create" })}
          className="flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-200 py-12 text-center dark:border-zinc-800">
          <p className="text-sm text-zinc-400">
            {search ? "Sin resultados para esa búsqueda." : "No hay clientes aún. Crea el primero."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900">
                <th className="border-b border-zinc-200 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  Nombre
                </th>
                <th className="border-b border-zinc-200 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  NIT / RUT
                </th>
                <th className="border-b border-zinc-200 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  Tipo
                </th>
                <th className="border-b border-zinc-200 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  Notas
                </th>
                <th className="border-b border-zinc-200 px-4 py-2.5 dark:border-zinc-800" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr
                  key={c.id}
                  className={cn(
                    "group border-b border-zinc-100 last:border-0 hover:bg-zinc-50/60 dark:border-zinc-800 dark:hover:bg-zinc-800/20",
                    i % 2 === 0 ? "" : "bg-zinc-50/30 dark:bg-zinc-900/20",
                  )}
                >
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    {c.name}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    {c.nit ?? <span className="text-zinc-300 dark:text-zinc-600">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {c.clientType ? (
                      <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                        {typeIcon(c.clientType)}
                        {typeLabel(c.clientType)}
                      </span>
                    ) : (
                      <span className="text-zinc-300 dark:text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="max-w-[280px] truncate px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {c.notes ?? <span className="text-zinc-300 dark:text-zinc-600">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() =>
                          setModal({
                            kind: "edit",
                            client: c,
                          })
                        }
                        className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setModal({ kind: "delete", client: c })}
                        className="rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-zinc-400">{clientsList.length} cliente{clientsList.length !== 1 ? "s" : ""} en total</p>

      {/* Modals */}
      {modal?.kind === "create" && (
        <ClientModal
          initial={EMPTY_FORM}
          onSave={handleCreate}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === "edit" && (
        <ClientModal
          initial={{
            name: modal.client.name,
            nit: modal.client.nit ?? "",
            clientType: modal.client.clientType ?? "",
            notes: modal.client.notes ?? "",
          }}
          onSave={handleEdit}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === "delete" && (
        <DeleteConfirm
          name={modal.client.name}
          onConfirm={handleDelete}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}
