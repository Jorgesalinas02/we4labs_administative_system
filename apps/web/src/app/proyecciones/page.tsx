import {
  loadBusinessCategories,
  loadCategoryEntries,
} from "@/lib/data";
import { ProjectionsMatrix } from "@/components/projections-matrix";
import { CASH_FLOW_DEFAULT_START_YM, cashFlowMonthPeriods } from "@we4labs/shared";

export default async function ProyeccionesPage() {
  if (!process.env.DATABASE_URL) {
    return <p className="text-sm text-zinc-500">Conecta la base de datos.</p>;
  }

  const [allCategories, categoryEntries] = await Promise.all([
    loadBusinessCategories(),
    loadCategoryEntries(),
  ]);

  // Historical months: use the configured cash flow period
  const histMonths = cashFlowMonthPeriods(CASH_FLOW_DEFAULT_START_YM);

  const incomeCategories = allCategories.filter((c) => c.kind === "income");
  const expenseCategories = allCategories.filter((c) => c.kind === "expense");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Proyecciones</h1>
        <p className="text-sm text-zinc-500">
          Proyección automática basada en tu flujo de caja real. Elige el nivel de crecimiento y
          el horizonte de tiempo.
        </p>
      </div>

      <ProjectionsMatrix
        incomeCategories={incomeCategories}
        expenseCategories={expenseCategories}
        historicalCells={categoryEntries.sums}
        histMonths={histMonths}
      />
    </div>
  );
}
