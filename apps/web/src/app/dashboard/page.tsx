export const dynamic = "force-dynamic";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  CalendarClock,
  ChevronRight,
  ReceiptText,
  BadgeCheck,
  Clock,
} from "lucide-react";
import { DashboardCashflowChart } from "@/components/dashboard-cashflow-chart";
import { loadDashboard } from "@/lib/data";

// ─── Formatters ───────────────────────────────────────────────────────────────

function money(n: number) {
  return n.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function shortMoney(n: number) {
  const abs = Math.abs(n);
  const prefix = n < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${prefix}$${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${prefix}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${prefix}$${(abs / 1_000).toFixed(0)}K`;
  return money(n);
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

function daysUntil(iso: string) {
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  if (diff < 0) return `Hace ${-diff}d`;
  return `En ${diff}d`;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
  href,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accent: "green" | "red" | "blue" | "amber";
  href?: string;
}) {
  const colors = {
    green: {
      bg: "bg-emerald-500",
      text: "text-emerald-700 dark:text-emerald-400",
      light: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    red: {
      bg: "bg-rose-500",
      text: "text-rose-700 dark:text-rose-400",
      light: "bg-rose-50 dark:bg-rose-950/40",
    },
    blue: {
      bg: "bg-blue-500",
      text: "text-blue-700 dark:text-blue-400",
      light: "bg-blue-50 dark:bg-blue-950/40",
    },
    amber: {
      bg: "bg-amber-500",
      text: "text-amber-700 dark:text-amber-400",
      light: "bg-amber-50 dark:bg-amber-950/40",
    },
  }[accent];

  const inner = (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {title}
        </p>
        <p className={`mt-1.5 text-2xl font-bold tabular-nums leading-none ${colors.text}`}>{value}</p>
        {sub && <p className="mt-1.5 text-xs text-zinc-400">{sub}</p>}
      </div>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colors.light}`}>
        <Icon className={`h-5 w-5 ${colors.text}`} />
      </div>
    </div>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const data = await loadDashboard();

  if (!data) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        <p className="font-semibold">Base de datos no disponible</p>
        <p className="mt-1 text-sm text-amber-800/90 dark:text-amber-200/90">
          Configura <code className="rounded bg-white/50 px-1">DATABASE_URL</code> y ejecuta{" "}
          <code className="rounded bg-white/50 px-1">pnpm db:migrate</code>.
        </p>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Dashboard
          </h1>
          <p className="mt-0.5 text-sm capitalize text-zinc-500 dark:text-zinc-400">{today}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/flujo-caja"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
          >
            <ArrowUpRight className="h-4 w-4" />
            Registrar ingreso
          </Link>
          <Link
            href="/flujo-caja"
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <ArrowDownRight className="h-4 w-4" />
            Registrar egreso
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Ingresos del mes"
          value={shortMoney(data.currentInflow)}
          sub={money(data.currentInflow)}
          icon={TrendingUp}
          accent="green"
          href="/flujo-caja"
        />
        <KpiCard
          title="Egresos del mes"
          value={shortMoney(data.currentOutflow)}
          sub={money(data.currentOutflow)}
          icon={TrendingDown}
          accent="red"
          href="/flujo-caja"
        />
        <KpiCard
          title="Flujo neto del mes"
          value={shortMoney(data.currentNet)}
          sub={data.currentNet >= 0 ? "Positivo" : "Negativo — revisa egresos"}
          icon={data.currentNet >= 0 ? ArrowUpRight : ArrowDownRight}
          accent={data.currentNet >= 0 ? "blue" : "amber"}
        />
        <KpiCard
          title="Saldo en caja"
          value={shortMoney(data.currentBalance)}
          sub={money(data.currentBalance)}
          icon={Wallet}
          accent={data.currentBalance >= 0 ? "green" : "red"}
          href="/supuestos"
        />
      </div>

      {/* Main content: chart + panels */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Chart – ocupa 2/3 */}
        <div className="xl:col-span-2">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Flujo de caja por mes
                </h2>
                <p className="text-xs text-zinc-500">Ingresos, egresos y flujo neto acumulado</p>
              </div>
              <Link
                href="/proyecciones"
                className="flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400"
              >
                Ver proyecciones <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <DashboardCashflowChart data={data.cashflowByMonth} />
          </div>
        </div>

        {/* Right panel – 1/3 */}
        <div className="flex flex-col gap-4">
          {/* Próximas obligaciones */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Próximas obligaciones
              </h2>
              <Link href="/calendario-tributario">
                <CalendarClock className="h-4 w-4 text-zinc-400 hover:text-zinc-600" />
              </Link>
            </div>
            {data.upcomingObligations.length === 0 ? (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/30">
                <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Sin obligaciones próximas
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {data.upcomingObligations.map((ob) => {
                  const days = Math.ceil(
                    (new Date(ob.dueOn).getTime() - Date.now()) / 86_400_000,
                  );
                  const urgent = days <= 5;
                  return (
                    <li
                      key={ob.id}
                      className={`flex items-start gap-2.5 rounded-xl p-3 ${urgent ? "bg-rose-50 dark:bg-rose-950/30" : "bg-zinc-50 dark:bg-zinc-800/60"}`}
                    >
                      {urgent ? (
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                      ) : (
                        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-200">
                          {ob.name}
                        </p>
                        <p className={`text-xs ${urgent ? "font-semibold text-rose-600" : "text-zinc-500"}`}>
                          {fmtDate(ob.dueOn)} · {daysUntil(ob.dueOn)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <Link
              href="/calendario-tributario"
              className="mt-3 flex items-center justify-center gap-1 rounded-xl border border-zinc-200 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400"
            >
              Ver calendario completo <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Alertas cartera */}
          {(data.overdueReceivables > 0 || data.overduePayables > 0) && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Cartera vencida
              </p>
              {data.overdueReceivables > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-amber-800 dark:text-amber-300">CxC por cobrar</span>
                  <span className="font-semibold text-emerald-700">{shortMoney(data.overdueReceivables)}</span>
                </div>
              )}
              {data.overduePayables > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-amber-800 dark:text-amber-300">CxP por pagar</span>
                  <span className="font-semibold text-rose-700">{shortMoney(data.overduePayables)}</span>
                </div>
              )}
              <Link
                href="/cartera"
                className="mt-3 flex items-center justify-center gap-1 rounded-xl border border-amber-300 py-2 text-xs font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-300"
              >
                Ver cartera <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Últimas transacciones */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Últimas transacciones
            </h2>
            <p className="text-xs text-zinc-500">
              {data.entryCount} transacciones totales registradas
            </p>
          </div>
          <Link
            href="/flujo-caja"
            className="flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400"
          >
            Ver flujo completo <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {data.recentTransactions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <ReceiptText className="h-8 w-8 text-zinc-300" />
            <p className="text-sm text-zinc-400">No hay transacciones aún</p>
            <Link
              href="/flujo-caja"
              className="mt-1 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
            >
              Registrar primera transacción
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {data.recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 py-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    tx.kind === "income"
                      ? "bg-emerald-100 dark:bg-emerald-950/50"
                      : "bg-rose-100 dark:bg-rose-950/50"
                  }`}
                >
                  {tx.kind === "income" ? (
                    <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-rose-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {tx.categoryName}
                  </p>
                  {tx.description && (
                    <p className="truncate text-xs text-zinc-400">{tx.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-semibold tabular-nums ${
                      tx.kind === "income"
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {tx.kind === "income" ? "+" : "-"}
                    {shortMoney(tx.amount)}
                  </p>
                  <p className="text-xs text-zinc-400">{fmtDate(tx.occurredOn)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
