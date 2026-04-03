"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function NominaCalculator() {
  const [baseSalary, setBaseSalary] = useState("3000000");
  const [days, setDays] = useState("30");
  const [transport, setTransport] = useState(true);
  const [contract, setContract] = useState<"indefinido" | "fijo" | "aprendiz">("indefinido");
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState<unknown>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/payroll/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseSalary: Number(baseSalary),
          daysWorked: Number(days),
          includeTransportAid: transport,
          contractType: contract,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      setOut(data);
    } catch (e) {
      setErr(String(e));
      setOut(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Entradas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Salario mensual base</label>
            <Input
              type="number"
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Días trabajados (mes)</label>
            <Input type="number" min={1} max={31} value={days} onChange={(e) => setDays(e.target.value)} className="mt-1" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={transport} onChange={(e) => setTransport(e.target.checked)} />
            Incluir auxilio de transporte (si aplica regla 2 SMMLV)
          </label>
          <div>
            <label className="text-sm font-medium">Tipo de contrato (informativo MVP)</label>
            <select
              className="mt-1 flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950"
              value={contract}
              onChange={(e) => setContract(e.target.value as typeof contract)}
            >
              <option value="indefinido">Término indefinido</option>
              <option value="fijo">Término fijo</option>
              <option value="aprendiz">Aprendizaje</option>
            </select>
          </div>
          <Button type="button" onClick={run} disabled={loading}>
            {loading ? "Calculando…" : "Calcular"}
          </Button>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Resultado</CardTitle>
        </CardHeader>
        <CardContent>
          {out ? (
            <pre className="max-h-[480px] overflow-auto rounded-lg bg-zinc-100 p-3 text-xs dark:bg-zinc-900">
              {JSON.stringify(out, null, 2)}
            </pre>
          ) : (
            <p className="text-sm text-zinc-500">Ejecuta el cálculo para ver el desglose.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
