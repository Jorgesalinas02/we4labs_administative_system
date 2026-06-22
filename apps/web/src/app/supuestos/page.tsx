export const dynamic = "force-dynamic";
import {
  loadLatestLegalParams,
  loadLatestPayrollParams,
  loadScenarios,
  loadTenantProfile,
  loadCashFlowSettings,
  loadCashFlowSheet,
  loadBusinessCategories,
} from "@/lib/data";
import { SupuestosView } from "@/components/supuestos-view";

export default async function SupuestosPage() {
  if (!process.env.DATABASE_URL) {
    return <p className="text-sm text-zinc-500">Conecta la base de datos para ver supuestos.</p>;
  }

  const [scenarios, payroll, legal, tenant, cfSettings, cfSheet, allCategories] =
    await Promise.all([
      loadScenarios(),
      loadLatestPayrollParams(),
      loadLatestLegalParams(),
      loadTenantProfile(),
      loadCashFlowSettings(),
      loadCashFlowSheet(),
      loadBusinessCategories(),
    ]);

  const saldoInicial =
    cfSheet && cfSheet.months[0]
      ? (cfSheet.values["saldo_inicial_de_caja"]?.[cfSheet.months[0]] ?? null)
      : null;

  const incomeCategories = allCategories.filter((c) => c.kind === "income");
  const expenseCategories = allCategories.filter((c) => c.kind === "expense");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Supuestos y parámetros del negocio</h1>
        <p className="text-sm text-zinc-500">
          Configura los parámetros fiscales, datos de tu empresa y proyecciones base para 2026.
        </p>
      </div>
      <SupuestosView
        scenarios={scenarios}
        payroll={payroll}
        legal={legal}
        tenant={tenant}
        cfSettings={cfSettings}
        saldoInicial={saldoInicial}
        startYm={cfSheet?.startYm ?? null}
        incomeCategories={incomeCategories}
        expenseCategories={expenseCategories}
      />
    </div>
  );
}
