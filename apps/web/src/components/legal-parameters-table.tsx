"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { legalParametersUpdateSchema } from "@we4labs/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LegalParamsRecord } from "@/lib/data";
import { cn } from "@/lib/cn";
import { dataTable as dt } from "@/lib/data-table-classes";

type ValueField = keyof Pick<
  LegalParamsRecord,
  | "effectiveFrom"
  | "employeeCount"
  | "averageMonthlySalaryCop"
  | "generalVatRatePct"
  | "clientsWithholdingSharePct"
  | "withholdingServicesRatePct"
  | "icaWithholdingRatePct"
  | "incomeSelfRetentionRatePct"
>;

const ROWS: { field: ValueField; concepto: string; kind: "date" | "int" | "money" | "percent" }[] = [
  { field: "effectiveFrom", concepto: "Vigente desde", kind: "date" },
  { field: "employeeCount", concepto: "Número de empleados", kind: "int" },
  { field: "averageMonthlySalaryCop", concepto: "Salario promedio mensual (COP)", kind: "money" },
  { field: "generalVatRatePct", concepto: "Tarifa IVA general", kind: "percent" },
  { field: "clientsWithholdingSharePct", concepto: "% de clientes con retención en la fuente", kind: "percent" },
  {
    field: "withholdingServicesRatePct",
    concepto: "Tarifa retención en la fuente (Servicios)",
    kind: "percent",
  },
  { field: "icaWithholdingRatePct", concepto: "Tarifa retención ICA", kind: "percent" },
  { field: "incomeSelfRetentionRatePct", concepto: "Tarifa autoretención renta", kind: "percent" },
];

function fractionToPercentString(frac: string | null | undefined): string {
  if (frac == null || frac === "") return "";
  const n = Number(frac);
  if (Number.isNaN(n)) return "";
  return String(Number((n * 100).toFixed(6)));
}

type FormValues = Record<ValueField, string>;

function toFormValues(legal: LegalParamsRecord): FormValues {
  return {
    effectiveFrom: legal.effectiveFrom,
    employeeCount: String(legal.employeeCount),
    averageMonthlySalaryCop: String(legal.averageMonthlySalaryCop),
    generalVatRatePct: fractionToPercentString(legal.generalVatRatePct),
    clientsWithholdingSharePct: fractionToPercentString(legal.clientsWithholdingSharePct),
    withholdingServicesRatePct: fractionToPercentString(legal.withholdingServicesRatePct),
    icaWithholdingRatePct: fractionToPercentString(legal.icaWithholdingRatePct),
    incomeSelfRetentionRatePct: fractionToPercentString(legal.incomeSelfRetentionRatePct),
  };
}

function refText(refs: Record<string, string> | null, field: ValueField): string {
  if (!refs || typeof refs[field] !== "string") return "—";
  return refs[field];
}

export function LegalParametersTable({ legal }: { legal: LegalParamsRecord }) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(() => toFormValues(legal));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refs = useMemo(() => legal.referencesJson ?? null, [legal.referencesJson]);

  useEffect(() => {
    setValues(toFormValues(legal));
  }, [
    legal.id,
    legal.effectiveFrom,
    legal.employeeCount,
    String(legal.averageMonthlySalaryCop),
    String(legal.generalVatRatePct ?? ""),
    String(legal.clientsWithholdingSharePct ?? ""),
    String(legal.withholdingServicesRatePct ?? ""),
    String(legal.icaWithholdingRatePct ?? ""),
    String(legal.incomeSelfRetentionRatePct ?? ""),
  ]);

  function setField(field: ValueField, v: string) {
    setValues((prev) => ({ ...prev, [field]: v }));
  }

  async function save() {
    setErr(null);
    setSaving(true);
    try {
      const payload = {
        id: legal.id,
        effectiveFrom: values.effectiveFrom.trim(),
        // initialCashBalance se gestiona en Supuestos → Saldo en caja/banco
        initialCashBalance: Number(legal.initialCashBalance),
        employeeCount: Number.parseInt(values.employeeCount.replace(/\s/g, ""), 10),
        averageMonthlySalaryCop: Number(values.averageMonthlySalaryCop.replace(/\s/g, "").replace(",", ".")),
        generalVatRatePct: Number(values.generalVatRatePct.replace(",", ".")),
        clientsWithholdingSharePct: Number(values.clientsWithholdingSharePct.replace(",", ".")),
        withholdingServicesRatePct: Number(values.withholdingServicesRatePct.replace(",", ".")),
        icaWithholdingRatePct: Number(values.icaWithholdingRatePct.replace(",", ".")),
        incomeSelfRetentionRatePct: Number(values.incomeSelfRetentionRatePct.replace(",", ".")),
      };
      const parsed = legalParametersUpdateSchema.safeParse(payload);
      if (!parsed.success) {
        setErr(parsed.error.issues.map((e) => e.message).join("; "));
        return;
      }
      const res = await fetch("/api/legal-parameters", {
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

  function inputForRow(row: (typeof ROWS)[number]) {
    const v = values[row.field];
    const common =
      "h-9 w-full min-w-[8rem] rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950";
    if (row.kind === "date") {
      return (
        <Input
          type="date"
          className={common}
          value={v}
          onChange={(e) => setField(row.field, e.target.value)}
        />
      );
    }
    if (row.kind === "int") {
      return (
        <Input
          type="number"
          min={0}
          step={1}
          className={common}
          value={v}
          onChange={(e) => setField(row.field, e.target.value)}
        />
      );
    }
    if (row.kind === "money") {
      return (
        <Input
          type="number"
          min={0}
          step={1}
          className={common}
          value={v}
          onChange={(e) => setField(row.field, e.target.value)}
          placeholder="COP"
        />
      );
    }
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          step="any"
          className={common}
          value={v}
          onChange={(e) => setField(row.field, e.target.value)}
        />
        <span className="shrink-0 text-xs text-zinc-500">%</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={dt.shell}>
        <table className={cn(dt.table, "min-w-[42rem]")}>
          <thead>
            <tr className={dt.trHeadLabels}>
              <th className={dt.thLabel}>Concepto</th>
              <th className={dt.thLabel}>Valor</th>
              <th className={dt.thLabel}>Referencia</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <tr key={row.field} className={dt.trBody(i)}>
                <td className={cn(dt.td, "align-top text-zinc-700 dark:text-zinc-300")}>{row.concepto}</td>
                <td className={cn(dt.td, "align-top")}>{inputForRow(row)}</td>
                <td className={cn(dt.td, "align-top text-xs leading-relaxed text-zinc-600 dark:text-zinc-400")}>
                  {refText(refs, row.field)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {legal.notes && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{legal.notes}</p>
      )}
      {err && <p className="text-sm text-red-600 dark:text-red-400">{err}</p>}
      <Button type="button" onClick={() => void save()} disabled={saving}>
        {saving ? "Guardando…" : "Guardar cambios"}
      </Button>
    </div>
  );
}
