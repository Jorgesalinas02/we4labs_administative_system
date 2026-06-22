"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { payrollEmployerParafiscalUpdateSchema } from "@we4labs/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PayrollParamsRecord } from "@/lib/data";
import { cn } from "@/lib/cn";
import { dataTable as dt } from "@/lib/data-table-classes";
import { useRole } from "@/components/role-provider";

type EmployerField = keyof Pick<
  PayrollParamsRecord,
  | "healthEmployerPct"
  | "pensionEmployerPct"
  | "risksEmployerPct"
  | "cajaEmployerPct"
  | "icbfEmployerPct"
  | "senaEmployerPct"
>;

const ROWS: { field: EmployerField; concepto: string }[] = [
  { field: "healthEmployerPct", concepto: "Salud (EPS)" },
  { field: "pensionEmployerPct", concepto: "Pensión (AFP)" },
  { field: "risksEmployerPct", concepto: "ARL (Riesgo I - Servicios)" },
  { field: "cajaEmployerPct", concepto: "Caja de Compensación" },
  { field: "icbfEmployerPct", concepto: "ICBF" },
  { field: "senaEmployerPct", concepto: "SENA" },
];

function fractionToPercentString(frac: string | null | undefined): string {
  if (frac == null || frac === "") return "";
  const n = Number(frac);
  if (Number.isNaN(n)) return "";
  return String(Number((n * 100).toFixed(6)));
}

type FormValues = Record<EmployerField, string>;

function toFormValues(p: PayrollParamsRecord): FormValues {
  return {
    healthEmployerPct: fractionToPercentString(p.healthEmployerPct),
    pensionEmployerPct: fractionToPercentString(p.pensionEmployerPct),
    risksEmployerPct: fractionToPercentString(p.risksEmployerPct),
    cajaEmployerPct: fractionToPercentString(p.cajaEmployerPct),
    icbfEmployerPct: fractionToPercentString(p.icbfEmployerPct),
    senaEmployerPct: fractionToPercentString(p.senaEmployerPct),
  };
}

function refText(refs: Record<string, string> | null, field: EmployerField): string {
  if (!refs || typeof refs[field] !== "string") return "—";
  return refs[field];
}

export function EmployerParafiscalTable({ payroll }: { payroll: PayrollParamsRecord }) {
  const router = useRouter();
  const { isAdmin } = useRole();
  const [values, setValues] = useState<FormValues>(() => toFormValues(payroll));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refs = useMemo(() => payroll.employerParafiscalRefsJson ?? null, [payroll.employerParafiscalRefsJson]);

  useEffect(() => {
    setValues(toFormValues(payroll));
  }, [
    payroll.id,
    String(payroll.healthEmployerPct ?? ""),
    String(payroll.pensionEmployerPct ?? ""),
    String(payroll.risksEmployerPct ?? ""),
    String(payroll.cajaEmployerPct ?? ""),
    String(payroll.icbfEmployerPct ?? ""),
    String(payroll.senaEmployerPct ?? ""),
  ]);

  const totalPct = useMemo(() => {
    let s = 0;
    for (const row of ROWS) {
      const n = Number(values[row.field].replace(",", "."));
      if (!Number.isNaN(n)) s += n;
    }
    return s;
  }, [values]);

  function setField(field: EmployerField, v: string) {
    setValues((prev) => ({ ...prev, [field]: v }));
  }

  async function save() {
    setErr(null);
    setSaving(true);
    try {
      const payload = {
        id: payroll.id,
        healthEmployerPct: Number(values.healthEmployerPct.replace(",", ".")),
        pensionEmployerPct: Number(values.pensionEmployerPct.replace(",", ".")),
        risksEmployerPct: Number(values.risksEmployerPct.replace(",", ".")),
        cajaEmployerPct: Number(values.cajaEmployerPct.replace(",", ".")),
        icbfEmployerPct: Number(values.icbfEmployerPct.replace(",", ".")),
        senaEmployerPct: Number(values.senaEmployerPct.replace(",", ".")),
      };
      const parsed = payrollEmployerParafiscalUpdateSchema.safeParse(payload);
      if (!parsed.success) {
        setErr(parsed.error.issues.map((e) => e.message).join("; "));
        return;
      }
      const res = await fetch("/api/payroll-parameters/employer-parafiscal", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Error al guardar");
      router.refresh();
    } catch (e) {
      setErr(String(e));
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "h-9 w-full min-w-[8rem] rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950";

  return (
    <div className="space-y-4">
      <div className={dt.shell}>
        <table className={cn(dt.table, "min-w-[42rem]")}>
          <thead>
            <tr className={dt.trHeadLabels}>
              <th className={dt.thLabel}>Concepto</th>
              <th className={dt.thLabel}>% Empleador</th>
              <th className={dt.thLabel}>Referencia</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <tr key={row.field} className={dt.trBody(i)}>
                <td className={cn(dt.td, "align-top text-zinc-700 dark:text-zinc-300")}>{row.concepto}</td>
                <td className={cn(dt.td, "align-top")}>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      className={inputCls}
                      value={values[row.field]}
                      onChange={(e) => setField(row.field, e.target.value)}
                    />
                    <span className="shrink-0 text-xs text-zinc-500">%</span>
                  </div>
                </td>
                <td className={cn(dt.td, "align-top text-xs leading-relaxed text-zinc-600 dark:text-zinc-400")}>
                  {refText(refs, row.field)}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/50">
              <td className={cn(dt.td, "font-medium text-zinc-900 dark:text-zinc-100")}>Total carga patronal</td>
              <td className={dt.td}>
                <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {totalPct.toLocaleString("es-CO", { maximumFractionDigits: 4 })} %
                </span>
              </td>
              <td className={dt.td} />
            </tr>
          </tbody>
        </table>
      </div>
      {err && <p className="text-sm text-red-600 dark:text-red-400">{err}</p>}
      {isAdmin && (
        <Button type="button" onClick={() => void save()} disabled={saving}>
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
      )}
    </div>
  );
}
