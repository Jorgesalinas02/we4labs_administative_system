"use client";

import type { InferSelectModel } from "drizzle-orm";
import { portfolioItems } from "@we4labs/db";
import {
  computeCarteraExcelEstado,
  computeReceivableAmountsFromGross,
  type CarteraReceivableRates,
} from "@we4labs/shared";
import { useEffect, useMemo, useState } from "react";
import { CopAmountInput } from "@/components/cop-amount-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { carteraNum, formatCarteraCop } from "@/lib/cartera-metrics";
import { cn } from "@/lib/cn";

export type CarteraReceivableFormRow = InferSelectModel<typeof portfolioItems>;

function labelCls() {
  return "mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400";
}

type ModalPropsBase = {
  open: boolean;
  onClose: () => void;
  rates: CarteraReceivableRates;
  todayYmd: string;
  onSaved: () => void;
};

type ModalPropsCreate = ModalPropsBase & { mode: "create" };

type ModalPropsEdit = ModalPropsBase & {
  mode: "edit";
  invoiceId: string;
  initial: CarteraReceivableFormRow;
};

export type CarteraReceivableFormModalProps = ModalPropsCreate | ModalPropsEdit;

export function CarteraReceivableFormModal(props: CarteraReceivableFormModalProps) {
  const { open, onClose, rates, todayYmd, onSaved } = props;
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [counterparty, setCounterparty] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [invoiceRefDisplay, setInvoiceRefDisplay] = useState("");
  const [nextInvoiceRef, setNextInvoiceRef] = useState("");
  const [refLoading, setRefLoading] = useState(false);
  const [issuedOn, setIssuedOn] = useState("");
  const [dueOn, setDueOn] = useState("");
  const [grossAmount, setGrossAmount] = useState(0);
  const [notes, setNotes] = useState("");
  /** Pagado actual (solo edición), para previsualizar saldo si cambia el bruto. */
  const [paidBaseline, setPaidBaseline] = useState(0);

  const derived = useMemo(() => {
    if (grossAmount <= 0) return null;
    return computeReceivableAmountsFromGross(grossAmount, rates);
  }, [grossAmount, rates]);

  const previewBalance = useMemo(() => {
    if (derived == null) return null;
    if (props.mode === "create") return derived.net;
    const paid = Math.min(paidBaseline, derived.net);
    return Math.max(0, derived.net - paid);
  }, [derived, props.mode, paidBaseline]);

  const previewEstado = useMemo(() => {
    if (derived == null || !dueOn || previewBalance == null) return null;
    return computeCarteraExcelEstado({
      grossPositive: grossAmount > 0,
      balance: previewBalance,
      dueOn,
      todayYmd,
    });
  }, [derived, dueOn, todayYmd, grossAmount, previewBalance]);

  const editKey = props.mode === "edit" ? props.invoiceId : "";

  useEffect(() => {
    if (!open) return;
    if (props.mode === "edit") {
      const r = props.initial;
      setErr(null);
      setCounterparty(r.counterparty);
      setServiceDescription(r.serviceDescription ?? "");
      setInvoiceRefDisplay(r.invoiceRef?.trim() ?? "");
      setIssuedOn(r.issuedOn ?? "");
      setDueOn(r.dueOn);
      const g = Math.round(carteraNum(r.grossAmount));
      setGrossAmount(g > 0 ? g : Math.round(carteraNum(r.amount)));
      setNotes(r.notes ?? "");
      setPaidBaseline(Math.round(carteraNum(r.paidAmount)));
      setRefLoading(false);
      return;
    }
    setErr(null);
    setCounterparty("");
    setServiceDescription("");
    setInvoiceRefDisplay("");
    setIssuedOn("");
    setDueOn("");
    setGrossAmount(0);
    setNotes("");
    setPaidBaseline(0);
    // Solo al abrir o al cambiar de factura (editKey); no enlazar props.initial entero (referencia inestable).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ver comentario
  }, [open, props.mode, editKey]);

  useEffect(() => {
    if (!open || props.mode !== "create") return;
    let cancelled = false;
    setNextInvoiceRef("");
    setRefLoading(true);
    void (async () => {
      try {
        const res = await fetch("/api/cartera/receivables");
        const data = (await res.json().catch(() => ({}))) as {
          nextInvoiceRef?: string;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setNextInvoiceRef("");
          setErr(typeof data.error === "string" ? data.error : "No se pudo obtener el N° de factura");
          return;
        }
        if (typeof data.nextInvoiceRef === "string") {
          setErr(null);
          setNextInvoiceRef(data.nextInvoiceRef);
        }
      } catch {
        if (!cancelled) {
          setNextInvoiceRef("");
          setErr("No se pudo obtener el N° de factura");
        }
      } finally {
        if (!cancelled) setRefLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, props.mode]);

  if (!open) return null;

  const titleId =
    props.mode === "create" ? "cartera-nueva-factura-title" : `cartera-edit-factura-${props.invoiceId}`;
  const title = props.mode === "create" ? "Nueva factura" : "Editar factura";
  const idSuffix = props.mode === "create" ? "new" : props.invoiceId;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!counterparty.trim()) {
      setErr("Indica el cliente.");
      return;
    }
    if (!issuedOn || !dueOn) {
      setErr("Indica fecha de emisión y de vencimiento.");
      return;
    }
    if (grossAmount <= 0) {
      setErr("Indica un valor bruto válido.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        counterparty: counterparty.trim(),
        serviceDescription: serviceDescription.trim() || undefined,
        issuedOn,
        dueOn,
        grossAmount,
        notes: notes.trim() || undefined,
      };
      const url =
        props.mode === "create" ? "/api/cartera/receivables" : `/api/cartera/receivables/${props.invoiceId}`;
      const method = props.mode === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "No se pudo guardar");
      }
      onSaved();
      onClose();
    } catch (x) {
      setErr(x instanceof Error ? x.message : String(x));
    } finally {
      setSaving(false);
    }
  }

  const nfValue = props.mode === "create" ? (refLoading ? "" : nextInvoiceRef) : invoiceRefDisplay;
  const nfPlaceholder = props.mode === "create" ? (refLoading ? "Cargando…" : "—") : "—";
  const nfHelp =
    props.mode === "create"
      ? "Asignado automáticamente (FAC-001, FAC-002…)."
      : "El consecutivo no se puede cambiar.";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h2 id={titleId} className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            IVA y retenciones se calculan como en el Excel (tarifas de Supuestos / parámetros legales).
          </p>
        </div>

        <form onSubmit={(e) => void submit(e)} className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-3 overflow-y-auto px-4 py-3">
            {err && <p className="text-sm text-red-600 dark:text-red-400">{err}</p>}

            <div>
              <label className={labelCls()} htmlFor={`cf-cliente-${idSuffix}`}>
                Cliente
              </label>
              <Input
                id={`cf-cliente-${idSuffix}`}
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
                placeholder="Razón social o nombre"
                autoComplete="organization"
                required
              />
            </div>

            <div>
              <label className={labelCls()} htmlFor={`cf-desc-${idSuffix}`}>
                Descripción del servicio
              </label>
              <Input
                id={`cf-desc-${idSuffix}`}
                value={serviceDescription}
                onChange={(e) => setServiceDescription(e.target.value)}
                placeholder="Opcional"
              />
            </div>

            <div>
              <label className={labelCls()} htmlFor={`cf-nf-${idSuffix}`}>
                N° factura
              </label>
              <Input
                id={`cf-nf-${idSuffix}`}
                readOnly
                tabIndex={-1}
                value={nfValue}
                placeholder={nfPlaceholder}
                className="cursor-default bg-zinc-50 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                aria-readonly="true"
              />
              <p className="mt-1 text-xs text-zinc-500">{nfHelp}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls()} htmlFor={`cf-emision-${idSuffix}`}>
                  Fecha emisión
                </label>
                <Input
                  id={`cf-emision-${idSuffix}`}
                  type="date"
                  value={issuedOn}
                  onChange={(e) => setIssuedOn(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className={labelCls()} htmlFor={`cf-venc-${idSuffix}`}>
                  Fecha vencimiento
                </label>
                <Input
                  id={`cf-venc-${idSuffix}`}
                  type="date"
                  value={dueOn}
                  onChange={(e) => setDueOn(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className={labelCls()} htmlFor={`cf-bruto-${idSuffix}`}>
                Valor bruto (COP)
              </label>
              <CopAmountInput id={`cf-bruto-${idSuffix}`} value={grossAmount} onCommit={setGrossAmount} />
            </div>

            <div>
              <label className={labelCls()} htmlFor={`cf-notes-${idSuffix}`}>
                Observaciones
              </label>
              <Input
                id={`cf-notes-${idSuffix}`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Opcional"
              />
            </div>

            {derived && (
              <div
                className={cn(
                  "rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/50",
                )}
              >
                <p className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">Calculado (Excel)</p>
                <ul className="space-y-1 tabular-nums text-zinc-800 dark:text-zinc-200">
                  <li className="flex justify-between gap-2">
                    <span>
                      IVA cobrado (
                      {(rates.ivaRate * 100).toLocaleString("es-CO", { maximumFractionDigits: 2 })}%)
                    </span>
                    <span>{formatCarteraCop(derived.iva)}</span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span>Retefuente descontada</span>
                    <span>{formatCarteraCop(derived.retefuente)}</span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span>ReteICA descontada</span>
                    <span>{formatCarteraCop(derived.reteica)}</span>
                  </li>
                  <li className="flex justify-between gap-2 border-t border-zinc-200 pt-1 font-medium dark:border-zinc-700">
                    <span>Neto a cobrar</span>
                    <span>{formatCarteraCop(derived.net)}</span>
                  </li>
                  {props.mode === "edit" ? (
                    <li className="flex justify-between gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                      <span>Pagado registrado (úsalo en «Pago de factura»)</span>
                      <span>{formatCarteraCop(paidBaseline)}</span>
                    </li>
                  ) : null}
                  {props.mode === "edit" && previewBalance != null ? (
                    <li className="flex justify-between gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      <span>Saldo pendiente (vista previa)</span>
                      <span>{formatCarteraCop(previewBalance)}</span>
                    </li>
                  ) : null}
                  {previewEstado ? (
                    <li className="flex justify-between gap-2 pt-1 text-xs text-zinc-600 dark:text-zinc-400">
                      <span>
                        {props.mode === "create" ? "Estado inicial (hoy)" : "Estado (hoy, vista previa)"}
                      </span>
                      <span>{previewEstado}</span>
                    </li>
                  ) : null}
                </ul>
                {props.mode === "edit" && derived && paidBaseline > derived.net ? (
                  <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                    El pagado supera el nuevo neto: al guardar se ajustará el pagado al neto.
                  </p>
                ) : null}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || (props.mode === "create" && refLoading)}>
              {saving ? "Guardando…" : props.mode === "create" ? "Guardar factura" : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
