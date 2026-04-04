import { CashFlowSheetMatrix } from "@/components/cash-flow-sheet-matrix";
import { CashMovementsTable } from "@/components/cash-movements-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadCashFlowSheet, loadCashMovements } from "@/lib/data";

export default async function FlujoCajaPage() {
  const [sheet, rows] = await Promise.all([loadCashFlowSheet(), loadCashMovements()]);
  if (!process.env.DATABASE_URL) {
    return <p className="text-sm text-zinc-500">Conecta la base de datos.</p>;
  }
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Flujo de caja</h1>
        <p className="text-sm text-zinc-500">
          Matriz mensual alineada a la hoja «Flujo de Caja» del Excel de referencia (entradas, salidas, flujo
          neto y saldos). Los movimientos detallados siguen disponibles abajo.
        </p>
      </div>

      {sheet ? (
        <Card className="w-max min-w-full">
          <CardHeader>
            <CardTitle>Proyección 12 meses</CardTitle>
          </CardHeader>
          <CardContent>
            <CashFlowSheetMatrix initial={sheet} />
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-zinc-500">
          No se pudo cargar la matriz de flujo de caja. Aplica migraciones (<code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">pnpm db:migrate</code>
          ) y vuelve a intentar.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Movimientos (detalle)</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          <CashMovementsTable rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
