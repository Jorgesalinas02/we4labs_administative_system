"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TeamMemberRecord } from "@/lib/data";
import { cn } from "@/lib/cn";
import { useRole } from "@/components/role-provider";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  UserRound,
  Briefcase,
  Handshake,
  HelpCircle,
  CircleCheck,
  CircleMinus,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const TEAM_KINDS = [
  { value: "empleado", label: "Empleado", icon: UserRound },
  { value: "contratista", label: "Contratista / Prestador", icon: Briefcase },
  { value: "socio", label: "Socio / Founder", icon: Handshake },
  { value: "otro", label: "Otro", icon: HelpCircle },
] as const;

function kindLabel(v: string | null) {
  return TEAM_KINDS.find((k) => k.value === v)?.label ?? v ?? "—";
}
function kindIcon(v: string | null) {
  const Icon = TEAM_KINDS.find((k) => k.value === v)?.icon ?? HelpCircle;
  return <Icon className="h-3.5 w-3.5 shrink-0" />;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

type TeamForm = { name: string; kind: string; email: string; notes: string };

const EMPTY_FORM: TeamForm = { name: "", kind: "empleado", email: "", notes: "" };

function TeamModal({
  initial,
  onSave,
  onClose,
}: {
  initial: TeamForm;
  onSave: (f: TeamForm) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<TeamForm>(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function set(k: keyof TeamForm, v: string) {
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
            {initial.name ? "Editar miembro" : "Nuevo miembro del equipo"}
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
              Nombre completo <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              type="text"
              placeholder="Ej. Juan García"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Tipo */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Tipo / rol
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TEAM_KINDS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set("kind", value)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors text-left",
                    form.kind === value
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

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Correo (opcional)
            </label>
            <input
              type="email"
              placeholder="juan@ejemplo.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Notas */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Notas
            </label>
            <textarea
              rows={3}
              placeholder="Cargo, especialidad, condiciones contractuales…"
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
            {saving ? "Guardando…" : initial.name ? "Guardar cambios" : "Agregar al equipo"}
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
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Eliminar miembro</h3>
        <p className="mt-2 text-sm text-zinc-500">
          ¿Seguro que deseas eliminar a{" "}
          <span className="font-medium text-zinc-800 dark:text-zinc-200">&ldquo;{name}&rdquo;</span>?
          Las transacciones asociadas quedarán sin asignar.
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
  | { kind: "edit"; member: TeamMemberRecord }
  | { kind: "delete"; member: TeamMemberRecord };

export function TeamView({ initialMembers }: { initialMembers: TeamMemberRecord[] }) {
  const router = useRouter();
  const { isAdmin } = useRole();
  const [members, setMembers] = useState<TeamMemberRecord[]>(initialMembers);
  const [modal, setModal] = useState<Modal | null>(null);
  const [search, setSearch] = useState("");

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.email ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  async function handleCreate(form: TeamForm) {
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        kind: form.kind,
        email: form.email || null,
        notes: form.notes || null,
      }),
    });
    const data = await res.json() as TeamMemberRecord & { error?: string };
    if (!res.ok) throw new Error(data.error ?? "Error al crear");
    setMembers((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    setModal(null);
    router.refresh();
  }

  async function handleEdit(form: TeamForm) {
    if (modal?.kind !== "edit") return;
    const res = await fetch("/api/team", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: modal.member.id,
        name: form.name,
        kind: form.kind,
        email: form.email || null,
        notes: form.notes || null,
      }),
    });
    const data = await res.json() as { error?: string };
    if (!res.ok) throw new Error(data.error ?? "Error al guardar");
    setMembers((prev) =>
      prev
        .map((m) =>
          m.id === modal.member.id
            ? { ...m, name: form.name, kind: form.kind, email: form.email || null, notes: form.notes || null }
            : m,
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
    setModal(null);
    router.refresh();
  }

  async function handleDelete() {
    if (modal?.kind !== "delete") return;
    const res = await fetch(`/api/team?id=${modal.member.id}`, { method: "DELETE" });
    const data = await res.json() as { error?: string };
    if (!res.ok) throw new Error(data.error ?? "Error al eliminar");
    setMembers((prev) => prev.filter((m) => m.id !== modal.member.id));
    setModal(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre o correo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 flex-1 max-w-xs rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        {isAdmin && (
          <button
            onClick={() => setModal({ kind: "create" })}
            className="flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Plus className="h-4 w-4" />
            Agregar miembro
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-200 py-12 text-center dark:border-zinc-800">
          <p className="text-sm text-zinc-400">
            {search
              ? "Sin resultados para esa búsqueda."
              : "No hay miembros del equipo aún. Agrega el primero."}
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
                  Tipo
                </th>
                <th className="border-b border-zinc-200 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  Correo
                </th>
                <th className="border-b border-zinc-200 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  Estado
                </th>
                <th className="border-b border-zinc-200 px-4 py-2.5 dark:border-zinc-800" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr
                  key={m.id}
                  className={cn(
                    "group border-b border-zinc-100 last:border-0 hover:bg-zinc-50/60 dark:border-zinc-800 dark:hover:bg-zinc-800/20",
                    i % 2 === 0 ? "" : "bg-zinc-50/30 dark:bg-zinc-900/20",
                  )}
                >
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    {m.name}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                      {kindIcon(m.kind)}
                      {kindLabel(m.kind)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {m.email ?? <span className="text-zinc-300 dark:text-zinc-600">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {m.active ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <CircleCheck className="h-3.5 w-3.5" />
                        Activo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-medium text-zinc-400 dark:text-zinc-500">
                        <CircleMinus className="h-3.5 w-3.5" />
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin && (
                      <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => setModal({ kind: "edit", member: m })}
                          className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setModal({ kind: "delete", member: m })}
                          className="rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-zinc-400">
        {members.length} miembro{members.length !== 1 ? "s" : ""} en total
      </p>

      {/* Modals */}
      {modal?.kind === "create" && (
        <TeamModal initial={EMPTY_FORM} onSave={handleCreate} onClose={() => setModal(null)} />
      )}
      {modal?.kind === "edit" && (
        <TeamModal
          initial={{
            name: modal.member.name,
            kind: modal.member.kind,
            email: modal.member.email ?? "",
            notes: modal.member.notes ?? "",
          }}
          onSave={handleEdit}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === "delete" && (
        <DeleteConfirm
          name={modal.member.name}
          onConfirm={handleDelete}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}
