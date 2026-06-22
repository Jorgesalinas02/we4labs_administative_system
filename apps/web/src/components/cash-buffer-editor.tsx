"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cashFlowBufferUpdateSchema } from "@we4labs/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRole } from "@/components/role-provider";
import type { CashFlowSettingsRecord } from "@/lib/data";

export function CashBufferEditor({
  settings,
  saldoInicial,
}: {
  settings: CashFlowSettingsRecord | null;
  saldoInicial?: number | null;
}) {
  const router = useRouter();
  const { isAdmin } = useRole();

  // ── Saldo inicial ──────────────────────────────────────────────────────────
  const [balance, setBalance] = useState<string>(
    saldoInicial != null ? String(saldoInicial) : "",
  );
  const [savingBalance, setSavingBalance] = useState(false);
  const [balanceErr, setBalanceErr] = useState<string | null>(null);
  const [balanceOk, setBalanceOk] = useState(false);

  useEffect(() => {
    setBalance(saldoInicial != null ? String(saldoInicial) : "");
  }, [saldoInicial]);

  async function saveBalance() {
    setBalanceErr(null);
    setBalanceOk(false);
    setSavingBalance(true);
    try {
      const amount = Number(balance.replace(/\./g, "").replace(",", "."));
      if (!Number.isFinite(amount) || amount < 0) {
        setBalanceErr("Ingresa un valor válido (≥ 0).");
        return;
      }
      const res = await fetch("/api/cash-flow-sheet/initial-balance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json().catch(() => ({})) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Error al guardar");
      setBalanceOk(true);
      router.refresh();
    } catch (e) {
      setBalanceErr(String(e));
    } finally {
      setSavingBalance(false);
    }
  }

  // ── Colchón mínimo ─────────────────────────────────────────────────────────
  const currentPct =
    settings?.minCashBufferPct != null ? Number(settings.minCashBufferPct) * 100 : null;
  const [bufferPct, setBufferPct] = useState<string>(
    currentPct != null ? String(Number(currentPct.toFixed(2))) : "",
  );
  const [savingBuffer, setSavingBuffer] = useState(false);
  const [bufferErr, setBufferErr] = useState<string | null>(null);
  const [bufferOk, setBufferOk] = useState(false);

  useEffect(() => {
    const p = settings?.minCashBufferPct != null ? Number(settings.minCashBufferPct) * 100 : null;
    setBufferPct(p != null ? String(Number(p.toFixed(2))) : "");
  }, [settings?.minCashBufferPct]);

  async function saveBuffer() {
    setBufferErr(null);
    setBufferOk(false);
    setSavingBuffer(true);
    try {
      const pct = Number(bufferPct.replace(",", ".")) / 100;
      const parsed = cashFlowBufferUpdateSchema.safeParse({ minCashBufferPct: pct });
      if (!parsed.success) {
        setBufferErr(parsed.error.issues.map((e) => e.message).join("; "));
        return;
      }
      const res = await fetch("/api/cash-flow-sheet/buffer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => ({})) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Error al guardar");
      setBufferOk(true);
      router.refresh();
    } catch (e) {
      setBufferErr(String(e));
    } finally {
      setSavingBuffer(false);
    }
  }

  const inputCls =
    "h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950";

  return (
    <div className="space-y-6">
      {/* Saldo inicial */}
      <div className="space-y-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Saldo inicial en caja / banco (COP)
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              step="1000"
              className={inputCls}
              placeholder="Ej. 25000000"
              value={balance}
              onChange={(e) => { setBalance(e.target.value); setBalanceOk(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") void saveBalance(); }}
              readOnly={!isAdmin}
            />
            {isAdmin && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void saveBalance()}
                disabled={savingBalance}
              >
                {savingBalance ? "…" : "Guardar"}
              </Button>
            )}
          </div>
          <p className="text-xs text-zinc-400">
            Dinero disponible en caja o banco al inicio del período del flujo de caja.
          </p>
        </div>
        {balanceErr && <p className="text-sm text-red-600 dark:text-red-400">{balanceErr}</p>}
        {balanceOk && <p className="text-sm text-emerald-600 dark:text-emerald-400">Saldo inicial guardado.</p>}
      </div>

      {/* Colchón mínimo */}
      <div className="space-y-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Colchón mínimo de seguridad (%)
          </label>
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={0}
              max={100}
              step="0.1"
              className={inputCls}
              value={bufferPct}
              onChange={(e) => { setBufferPct(e.target.value); setBufferOk(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") void saveBuffer(); }}
              readOnly={!isAdmin}
            />
            <span className="shrink-0 text-xs text-zinc-500">%</span>
            {isAdmin && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void saveBuffer()}
                disabled={savingBuffer}
              >
                {savingBuffer ? "…" : "Guardar"}
              </Button>
            )}
          </div>
          <p className="text-xs text-zinc-400">
            Ejemplo: 10 % significa que debes mantener al menos el 10 % de los egresos mensuales
            como reserva de caja.
          </p>
        </div>
        {bufferErr && <p className="text-sm text-red-600 dark:text-red-400">{bufferErr}</p>}
        {bufferOk && <p className="text-sm text-emerald-600 dark:text-emerald-400">Colchón guardado.</p>}
      </div>
    </div>
  );
}
