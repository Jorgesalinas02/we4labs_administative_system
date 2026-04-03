import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadCashMovements } from "@/lib/data";

function money(n: string | number) {
  const x = typeof n === "string" ? Number(n) : n;
  return x.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

export default async function FlujoCajaPage() {
  const rows = await loadCashMovements();
  if (!process.env.DATABASE_URL) {
    return <p className="text-sm text-zinc-500">Conecta la base de datos.</p>;
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Flujo de caja</h1>
        <p className="text-sm text-zinc-500">Movimientos reales y proyecciones por categoría.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Movimientos</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
                <th className="pb-2 pr-4 font-medium">Fecha</th>
                <th className="pb-2 pr-4 font-medium">Tipo</th>
                <th className="pb-2 pr-4 font-medium">Categoría</th>
                <th className="pb-2 pr-4 font-medium">Monto</th>
                <th className="pb-2 font-medium">Proy.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-zinc-100 dark:border-zinc-900">
                  <td className="py-2 pr-4">{r.occurredOn}</td>
                  <td className="py-2 pr-4">{r.kind === "inflow" ? "Entrada" : "Salida"}</td>
                  <td className="py-2 pr-4">{r.category}</td>
                  <td className="py-2 pr-4 tabular-nums">{money(r.amount)}</td>
                  <td className="py-2">{r.isProjection ? "Sí" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="pt-4 text-sm text-zinc-500">Sin movimientos. Ejecuta seed o agrega registros.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
