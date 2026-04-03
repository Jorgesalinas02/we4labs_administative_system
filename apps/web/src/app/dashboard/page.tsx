import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCashflowChart } from "@/components/dashboard-cashflow-chart";
import { loadDashboard } from "@/lib/data";

function money(n: number) {
  return n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

export default async function DashboardPage() {
  const data = await loadDashboard();

  if (!data) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        <p className="font-medium">Base de datos no disponible</p>
        <p className="mt-1 text-amber-800/90 dark:text-amber-200/90">
          Configura <code className="rounded bg-white/50 px-1 dark:bg-black/30">DATABASE_URL</code>, arranca Postgres
          (<code className="rounded bg-white/50 px-1">docker compose up -d</code>) y ejecuta{" "}
          <code className="rounded bg-white/50 px-1">pnpm db:migrate</code> y <code className="rounded bg-white/50 px-1">pnpm db:seed</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-zinc-500">Seguimiento de liquidez y cartera (datos reales del tenant).</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Entradas registradas</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tabular-nums">{money(data.inflow)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Salidas registradas</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tabular-nums">{money(data.outflow)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Flujo neto</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
            {money(data.net)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>CxC vencido</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tabular-nums text-rose-700 dark:text-rose-400">
            {money(data.overdueReceivables)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>CxP vencido</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tabular-nums text-amber-700 dark:text-amber-400">
            {money(data.overduePayables)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Movimientos / cuenta abierta</CardTitle>
          </CardHeader>
          <CardContent className="text-lg">
            {data.movementCount} mov. · {data.portfolioOpen} doc. cartera
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Flujo de caja por mes</CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardCashflowChart data={data.cashflowByMonth} />
        </CardContent>
      </Card>
    </div>
  );
}
