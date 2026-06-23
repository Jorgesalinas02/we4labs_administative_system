export const dynamic = "force-dynamic";
import {
  loadCashFlowSheet,
  loadBusinessCategories,
  loadCategoryEntries,
  loadClients,
  loadTeamMembers,
  loadGroupBudgets,
} from "@/lib/data";
import { CashFlowCategoryMatrix } from "@/components/cash-flow-category-matrix";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CASH_FLOW_DEFAULT_START_YM, cashFlowMonthPeriods, cashFlowMonthLabelEs } from "@we4labs/shared";

export default async function FlujoCajaPage() {
  if (!process.env.DATABASE_URL) {
    return <p className="text-sm text-zinc-500">Conecta la base de datos.</p>;
  }

  const [sheet, allCategories, categoryEntries, clientsList, teamMembersList] = await Promise.all([
    loadCashFlowSheet(),
    loadBusinessCategories(),
    loadCategoryEntries(),
    loadClients(),
    loadTeamMembers(),
  ]);

  // Cargado aparte para no romper el resto si falla
  const groupBudgets = await loadGroupBudgets();

  const startYm = sheet?.startYm ?? CASH_FLOW_DEFAULT_START_YM;
  const months = cashFlowMonthPeriods(startYm);
  const monthLabels = months.map(cashFlowMonthLabelEs);

  const saldoInicial =
    sheet?.values["saldo_inicial_de_caja"]?.[months[0]!] ?? 0;

  const incomeCategories = allCategories.filter((c) => c.kind === "income");
  const expenseCategories = allCategories.filter((c) => c.kind === "expense");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Flujo de caja</h1>
        <p className="text-sm text-zinc-500">
          Registra ingresos y egresos mes a mes. Haz clic en{" "}
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-zinc-300 text-zinc-400">
            +
          </span>{" "}
          en cualquier categoría para añadir una transacción.
        </p>
      </div>

      <Card className="w-max min-w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Período {startYm} — {months[months.length - 1]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CashFlowCategoryMatrix
            incomeCategories={incomeCategories}
            expenseCategories={expenseCategories}
            initialSums={categoryEntries.sums}
            initialEntries={categoryEntries.entries}
            months={months}
            monthLabels={monthLabels}
            saldoInicial={saldoInicial}
            clients={clientsList}
            teamMembers={teamMembersList}
            initialBudgets={groupBudgets}
          />
        </CardContent>
      </Card>
    </div>
  );
}
