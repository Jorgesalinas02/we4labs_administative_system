"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CopAmountInput } from "@/components/cop-amount-input";
import { Button } from "@/components/ui/button";
import { carteraBalancePending, carteraNum, formatCarteraCop } from "@/lib/cartera-metrics";
import { cn } from "@/lib/cn";
import { useRole } from "@/components/role-provider";
import type { CarteraPortfolioRow } from "@/components/cartera-receivables-table";

function labelCls() {
  return "mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400";
}

function optionLabel(r: CarteraPortfolioRow): string {
  const ref = r.invoiceRef?.trim() || "Sin N°";
  const client = r.counterparty.trim() || "Cliente";
  return `${ref} — ${client} (${formatCarteraCop(carteraNum(r.amount))} neto)`;
}

export function CarteraInvoicePaymentButton({
  rows,
  cashFlowMonths,
  cashFlowMonthLabels,
}: {
  rows: CarteraPortfolioRow[];
  cashFlowMonths: string[];
  cashFlowMonthLabels: string[];
}) {
  const router = useRouter();
  const { isAdmin } = useRole();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [cashFlowPeriodYm, setCashFlowPeriodYm] = useState("");

  const selected = useMemo(
    () => rows.find((r) => r.id === selectedId) ?? null,
    [rows, selectedId],
  );

  const net = selected ? carteraNum(selected.amount) : 0;
  const paid = selected ? carteraNum(selected.paidAmount) : 0;
  const balance = selected ? carteraBalancePending(selected) : 0;

  useEffect(() => {
    if (!open || rows.length === 0) return;
    setSelectedId((prev) => {
      if (prev && rows.some((r) => r.id === prev)) return prev;
      return rows[0]!.id;
    });
  }, [open, rows]);

  useEffect(() => {
    if (!open || cashFlowMonths.length === 0) return;
    const now = new Date();
    const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    setCashFlowPeriodYm((prev) => {
      if (prev && cashFlowMonths.includes(prev)) return prev;
      if (cashFlowMonths.includes(cur)) return cur;
      return cashFlowMonths[0]!;
    });
  }, [open, cashFlowMonths]);

  function resetForm() {
    setPaymentAmount(0);
    setErr(null);
  }

  function close() {
    setOpen(false);
    resetForm();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!selectedId) {
      setErr("Selecciona una factura.");
      return;
    }
    if (paymentAmount <= 0) {
      setErr("Indica un monto de pago mayor a cero.");
      return;
    }
    if (balance <= 0) {
      setErr("Esta factura no tiene saldo pendiente.");
      return;
    }
    if (!cashFlowPeriodYm || !/^\d{4}-\d{2}$/.test(cashFlowPeriodYm)) {
      setErr("Selecciona el mes de imputación en el flujo de caja.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/cartera/receivables/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentAmount, cashFlowPeriodYm }),
      });
      const bodyText = await res.text();
      let data: { error?: string } = {};
      try {
        data = JSON.parse(bodyText) as { error?: string };
      } catch {
        /* respuesta no JSON (p. ej. error 500 HTML) */
      }
      if (!res.ok) {
        const msg =
          typeof data.error === "string" && data.error.trim()
            ? data.error
            : bodyText.trim().slice(0, 400) || `Error HTTP ${res.status}`;
        throw new Error(msg);
      }
      close();
      router.refresh();
    } catch (x) {
      setErr(x instanceof Error ? x.message : String(x));
    } finally {
      setSaving(false);
    }
  }

  if (!isAdmin || rows.length === 0) {
    return null;
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Pago de factura
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60" aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cartera-pago-factura-title"
            className="relative z-10 flex max-h-[min(90vh,560px)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <h2 id="cartera-pago-factura-title" className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Pago de factura
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                El monto se suma a «Pagado». Indica en qué mes del flujo de caja imputar este cobro (mismas
                columnas que la hoja de flujo).
              </p>
            </div>

            <form onSubmit={(e) => void submit(e)} className="flex min-h-0 flex-1 flex-col">
              <div className="space-y-3 overflow-y-auto px-4 py-3">
                {err && <p className="text-sm text-red-600 dark:text-red-400">{err}</p>}

                <div>
                  <label className={labelCls()} htmlFor="pay-invoice">
                    Factura
                  </label>
                  <select
                    id="pay-invoice"
                    className={cn(
                      "flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm",
                      "dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100",
                    )}
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                  >
                    {rows.map((r) => (
                      <option key={r.id} value={r.id}>
                        {optionLabel(r)}
                      </option>
                    ))}
                  </select>
                </div>

                {selected && (
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm tabular-nums dark:border-zinc-800 dark:bg-zinc-900/50">
                    <p className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">Resumen</p>
                    <ul className="space-y-1 text-zinc-800 dark:text-zinc-200">
                      <li className="flex justify-between gap-2">
                        <span>Neto a cobrar</span>
                        <span>{formatCarteraCop(net)}</span>
                      </li>
                      <li className="flex justify-between gap-2">
                        <span>Ya pagado</span>
                        <span>{formatCarteraCop(paid)}</span>
                      </li>
                      <li className="flex justify-between gap-2 font-medium">
                        <span>Saldo pendiente</span>
                        <span>{formatCarteraCop(balance)}</span>
                      </li>
                    </ul>
                  </div>
                )}

                <div>
                  <label className={labelCls()} htmlFor="pay-cf-month">
                    Mes en flujo de caja
                  </label>
                  <select
                    id="pay-cf-month"
                    className={cn(
                      "flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm",
                      "dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100",
                    )}
                    value={cashFlowPeriodYm}
                    onChange={(e) => setCashFlowPeriodYm(e.target.value)}
                    required
                  >
                    {cashFlowMonths.map((ym, i) => (
                      <option key={ym} value={ym}>
                        {cashFlowMonthLabels[i] ?? ym} ({ym})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-zinc-500">
                    Queda guardado en la factura para ubicar este cobro al cargar entradas en el flujo.
                  </p>
                </div>

                <div>
                  <label className={labelCls()} htmlFor="pay-amount">
                    Monto del pago (COP)
                  </label>
                  <CopAmountInput id="pay-amount" value={paymentAmount} onCommit={setPaymentAmount} />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
                <Button type="button" variant="outline" onClick={close} disabled={saving}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving || balance <= 0 || !cashFlowPeriodYm}>
                  {saving ? "Guardando…" : "Registrar pago"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
