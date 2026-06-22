"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { tenantBusinessProfileUpdateSchema } from "@we4labs/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TenantProfileRecord } from "@/lib/data";

const SECTORES = [
  "Servicios profesionales / consultoría",
  "Tecnología / software",
  "Comercio al por menor",
  "Comercio al por mayor",
  "Manufactura / industria",
  "Construcción",
  "Salud y bienestar",
  "Educación / formación",
  "Restaurantes / alimentos",
  "Transporte y logística",
  "Agropecuario",
  "Financiero / seguros",
  "Arte, cultura y entretenimiento",
  "Otro",
];

export function BusinessProfileEditor({ tenant }: { tenant: TenantProfileRecord }) {
  const router = useRouter();
  const [name, setName] = useState(tenant.name);
  const [sector, setSector] = useState(tenant.sector ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setName(tenant.name);
    setSector(tenant.sector ?? "");
  }, [tenant.id, tenant.name, tenant.sector]);

  function onChange() {
    setSuccess(false);
  }

  async function save() {
    setErr(null);
    setSuccess(false);
    setSaving(true);
    try {
      const parsed = tenantBusinessProfileUpdateSchema.safeParse({ name, sector });
      if (!parsed.success) {
        setErr(parsed.error.issues.map((e) => e.message).join("; "));
        return;
      }
      const res = await fetch("/api/tenant/business-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Error al guardar");
      setSuccess(true);
      router.refresh();
    } catch (e) {
      setErr(String(e));
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Nombre del negocio
          </label>
          <Input
            type="text"
            maxLength={200}
            className={inputCls}
            value={name}
            onChange={(e) => { setName(e.target.value); onChange(); }}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Sector económico
          </label>
          <select
            value={sector}
            onChange={(e) => { setSector(e.target.value); onChange(); }}
            className={inputCls}
          >
            <option value="">— Selecciona —</option>
            {SECTORES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {err && <p className="text-sm text-red-600 dark:text-red-400">{err}</p>}
      {success && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">Guardado correctamente.</p>
      )}

      <Button type="button" onClick={() => void save()} disabled={saving || !name || !sector}>
        {saving ? "Guardando…" : "Guardar"}
      </Button>
    </div>
  );
}
