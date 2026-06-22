"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { payrollSalaryBaseUpdateSchema } from "@we4labs/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRole } from "@/components/role-provider";
import type { PayrollParamsRecord } from "@/lib/data";

type FormValues = { smmlv: string; uvt: string; transportAidMonthly: string };

function formatCop(n: string | number | null | undefined) {
  if (n == null || n === "") return "—";
  const v = Number(n);
  if (Number.isNaN(v)) return String(n);
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(v);
}

function toFormValues(p: PayrollParamsRecord): FormValues {
  return {
    smmlv: p.smmlv != null ? String(Math.round(Number(p.smmlv))) : "",
    uvt: p.uvt != null ? String(Math.round(Number(p.uvt))) : "",
    transportAidMonthly:
      p.transportAidMonthly != null ? String(Math.round(Number(p.transportAidMonthly))) : "",
  };
}

export function SalaryBaseEditor({ payroll }: { payroll: PayrollParamsRecord }) {
  const router = useRouter();
  const { isAdmin } = useRole();
  const [values, setValues] = useState<FormValues>(() => toFormValues(payroll));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setValues(toFormValues(payroll));
  }, [payroll.id, String(payroll.smmlv ?? ""), String(payroll.uvt ?? ""), String(payroll.transportAidMonthly ?? "")]);

  function setField(field: keyof FormValues, v: string) {
    setValues((prev) => ({ ...prev, [field]: v }));
    setSuccess(false);
  }

  async function save() {
    setErr(null);
    setSuccess(false);
    setSaving(true);
    try {
      const payload = {
        id: payroll.id,
        smmlv: Number(values.smmlv.replace(/\./g, "").replace(",", ".")),
        uvt: Number(values.uvt.replace(/\./g, "").replace(",", ".")),
        transportAidMonthly: Number(values.transportAidMonthly.replace(/\./g, "").replace(",", ".")),
      };
      const parsed = payrollSalaryBaseUpdateSchema.safeParse(payload);
      if (!parsed.success) {
        setErr(parsed.error.issues.map((e) => e.message).join("; "));
        return;
      }
      const res = await fetch("/api/payroll-parameters/salary-base", {
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

  const rows: { field: keyof FormValues; label: string; hint: string }[] = [
    {
      field: "smmlv",
      label: "SMMLV 2026 ($ COP)",
      hint: `Actual: ${formatCop(payroll.smmlv)}`,
    },
    {
      field: "uvt",
      label: "UVT 2026 ($ COP)",
      hint: `Actual: ${formatCop(payroll.uvt)}`,
    },
    {
      field: "transportAidMonthly",
      label: "Auxilio de transporte mensual ($ COP)",
      hint: `Actual: ${formatCop(payroll.transportAidMonthly)}`,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {rows.map(({ field, label, hint }) => (
          <div key={field} className="space-y-1">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</label>
            <Input
              type="number"
              min={0}
              step={1}
              className={inputCls}
              value={values[field]}
              onChange={(e) => setField(field, e.target.value)}
            />
            <p className="text-xs text-zinc-400 dark:text-zinc-500">{hint}</p>
          </div>
        ))}
      </div>

      {err && <p className="text-sm text-red-600 dark:text-red-400">{err}</p>}
      {success && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">Guardado correctamente.</p>
      )}

      {isAdmin && (
        <Button type="button" onClick={() => void save()} disabled={saving}>
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
      )}

      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        Vigente desde: {payroll.effectiveFrom}. Estos valores se usan en la calculadora de nómina y
        en la regla del 2 SMMLV para auxilio de transporte.
      </p>
    </div>
  );
}
