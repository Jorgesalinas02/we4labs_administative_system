"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EmailAllowlistRecord } from "@/lib/data";
import type { UserRole } from "@we4labs/shared";
import { Mail, Plus, Trash2, ShieldCheck } from "lucide-react";

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Administrador",
  consultor: "Consultor",
};

export function ConfiguracionView({
  initialEmails,
  currentEmail,
}: {
  initialEmails: EmailAllowlistRecord[];
  currentEmail: string;
}) {
  const router = useRouter();
  const [emails, setEmails] = useState(initialEmails);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("consultor");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const value = newEmail.trim().toLowerCase();
    if (!value) return;

    setSaving(true);
    try {
      const res = await fetch("/api/email-allowlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, role: newRole }),
      });
      const data = (await res.json()) as { error?: string } & Partial<EmailAllowlistRecord>;
      if (!res.ok) throw new Error(data.error ?? "Error al guardar");

      setEmails((prev) => [...prev, data as EmailAllowlistRecord]);
      setNewEmail("");
      setNewRole("consultor");
      setSuccess(`${value} autorizado como ${ROLE_LABEL[newRole]}.`);
      router.refresh();
    } catch (err) {
      setError(String(err).replace("Error: ", ""));
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleChange(id: string, role: UserRole) {
    setError(null);
    setSuccess(null);
    const res = await fetch("/api/email-allowlist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "No se pudo cambiar el rol");
      return;
    }
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, role } : e)));
    setSuccess("Rol actualizado.");
    router.refresh();
  }

  async function handleDelete(id: string) {
    setError(null);
    setSuccess(null);
    if (!confirm("¿Eliminar este usuario de la lista autorizada?")) return;

    const res = await fetch(`/api/email-allowlist?id=${id}`, { method: "DELETE" });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "No se pudo eliminar");
      return;
    }
    setEmails((prev) => prev.filter((e) => e.id !== id));
    setSuccess("Usuario eliminado de la lista.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Usuarios</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Administra qué correos pueden ingresar al sistema y con qué rol.
        </p>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div className="text-sm text-emerald-900 dark:text-emerald-200">
            <p className="font-medium">Acceso por correo y rol</p>
            <p className="mt-1 text-emerald-800/80 dark:text-emerald-300/80">
              Solo los correos de esta lista pueden usar el sistema tras autenticarse con Clerk.
              Los <span className="font-medium">Administradores</span> tienen acceso total; los{" "}
              <span className="font-medium">Consultores</span> solo pueden ver, sin editar.
              Tu sesión actual: <span className="font-medium">{currentEmail}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Agregar usuario</h2>
        <form onSubmit={handleAdd} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="email"
              placeholder="usuario@empresa.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as UserRole)}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="consultor">Consultor</option>
            <option value="admin">Administrador</option>
          </select>
          <button
            type="submit"
            disabled={saving || !newEmail.trim()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {saving ? "Guardando…" : "Agregar"}
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        {success && <p className="mt-3 text-sm text-emerald-600">{success}</p>}
      </div>

      <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Usuarios autorizados ({emails.length})
          </h2>
        </div>
        {emails.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-zinc-400">
            No hay usuarios registrados. Agrega al menos uno para permitir el acceso.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {emails.map((row) => {
              const isSelf = row.email.toLowerCase() === currentEmail.toLowerCase();
              const role: UserRole = row.role === "admin" ? "admin" : "consultor";
              return (
                <li key={row.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {row.email}
                      {isSelf && (
                        <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">
                          tú
                        </span>
                      )}
                    </p>
                    {row.addedBy && (
                      <p className="text-xs text-zinc-400">Agregado por {row.addedBy}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={role}
                      onChange={(e) => handleRoleChange(row.id, e.target.value as UserRole)}
                      disabled={isSelf}
                      title={isSelf ? "No puedes cambiar tu propio rol" : "Cambiar rol"}
                      className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950"
                    >
                      <option value="consultor">Consultor</option>
                      <option value="admin">Administrador</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleDelete(row.id)}
                      disabled={isSelf}
                      title={isSelf ? "No puedes eliminarte a ti mismo" : "Eliminar"}
                      className="rounded-lg p-2 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
